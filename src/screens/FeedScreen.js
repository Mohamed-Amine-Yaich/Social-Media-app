import { useState, useEffect } from "react";
import { FlatList, Pressable, Image, Text, StyleSheet } from "react-native";
import posts from "../../assets/data/posts.json"; //replacer les post par fetched postes
import FeedPost from "../components/FeedPost";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Auth, DataStore } from "aws-amplify";
import { S3Image } from "aws-amplify-react-native";

import { Post, User } from "../models";

const img =
  "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/user.png";

const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  const createPost = () => {
    navigation.navigate("Create Post");
  };

  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const authUser = await Auth.currentAuthenticatedUser();
      DataStore.query(User, authUser.attributes.sub).then(setUser);
    };

    fetch();
  }, []);

  useEffect(() => {
    DataStore.query(Post).then(setPosts);
  }, []);
  //console.log(user?.image);
  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <FeedPost post={item} />}
      ListHeaderComponent={() => (
        <Pressable onPress={createPost} style={styles.header}>
          {user ? (
            <S3Image imgKey={user.image} style={styles.profileImage} />
          ) : (
            <Image source={{ uri: img }} style={styles.profileImage} />
          )}

          <Text style={styles.name}>What's on your mind?</Text>
          <Entypo
            name="images"
            size={24}
            color="limegreen"
            style={styles.icon}
          />
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 10,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "white",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    color: "gray",
  },
  icon: {
    marginLeft: "auto",
  },
});

export default FeedScreen;
