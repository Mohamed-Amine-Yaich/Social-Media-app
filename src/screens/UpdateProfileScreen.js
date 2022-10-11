import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Button,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { API, graphqlOperation, Auth, DataStore, Storage } from "aws-amplify";
import { useNavigation } from "@react-navigation/native";
import { User } from "../models";
import { S3Image } from "aws-amplify-react-native";

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
const dummy_img =
  "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/user.png";

const createUser = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      createdAt
      updatedAt
      name
      image
      _version
      _lastChangedAt
      _deleted
    }
  }
`;

const UpdateProfileScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const insets = useSafeAreaInsets();
  const [dbUser, setDbUser] = useState(null);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  useEffect(() => {
    const fetchDbUser = async () => {
      const authUser = await Auth.currentAuthenticatedUser();
      const dbUser = await DataStore.query(User, authUser.attributes.sub);
      if (dbUser) {
        setDbUser(dbUser);
        setName(dbUser.name);
        setImage(dbUser.image);
        console.log(dbUser.image);
      }
    };
    fetchDbUser();
    //when component mount query the authUser from the db
  }, []);

  const uploadFile = async fileUri => {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const key = `${uuidv4()}.png`;
      await Storage.put(key, blob, {
        contentType: "image/png",
      });
      return key;
    } catch (err) {
      console.log("Error uploading file:", err);
    }
  };

  const onSave = async () => {
    //check if authuser exist in db then update else create

    if (dbUser) {
      //updateUser
      let imageKey = "";
      if (image) {
        imageKey = await uploadFile(image);
      }
      await DataStore.save(
        User.copyOf(dbUser, updated => {
          updated.name = name;
          if (imageKey) {
            updated.image = imageKey;
          }
        })
      );
    } else {
      //creating an object with the user props and use graphql to save it with the id of the current auth user

      const authUser = await Auth.currentAuthenticatedUser();

      const UpdatedUser = {
        id: authUser.attributes.sub,
        name,
        _version: 1,
      };
      if (image) {
        UpdatedUser.image = await uploadFile(image);
      }

      await API.graphql(graphqlOperation(createUser, { input: UpdatedUser }));
    }

    navigation.navigate("Feed");
  };

  /* let renderImage = <Image source={{ uri: dummy_img }} style={styles.image} />;
  if (image) {
    renderImage = <Image source={{ uri: image }} style={styles.image} />;
  } else if (dbUser?.image) {
    renderImage = <S3Image imgKey={dbUser.image} style={styles.image} />;
  } */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { marginBottom: insets.bottom }]}
      contentContainerStyle={{ flex: 1 }}
      keyboardVerticalOffset={150}
    >
      <Pressable onPress={pickImage} style={styles.imagePickerContainer}>
        <S3Image imgKey={image} style={styles.image} />
        <Text>Change photo</Text>
      </Pressable>

      <TextInput
        placeholder="Full name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.buttonContainer}>
        <Button onPress={onSave} title="Save" disabled={!name} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    padding: 10,
  },
  imagePickerContainer: {
    alignItems: "center",
  },
  image: {
    width: "30%",
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 500,
  },
  input: {
    borderColor: "lightgrayVa",
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: "100%",
    marginVertical: 10,
    padding: 10,
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 10,
    alignSelf: "stretch",
  },
});

export default UpdateProfileScreen;
