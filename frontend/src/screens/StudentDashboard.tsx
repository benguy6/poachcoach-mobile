import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StudentDashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
          style={styles.profilePic}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.greeting}>Hello, John!</Text>

        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Level</Text>
            <Text style={styles.cardText}>Intermediate</Text>
            <Text style={styles.cardSubtext}>Next test in 20:19:23</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Awards</Text>
            <Text style={styles.cardText}>4</Text>
            <Text style={styles.cardSubtext}>+33% month over month</Text>
          </View>
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.cardTitle}>Upcoming Classes</Text>
          <Text style={styles.bigText}>20 Sep 9:30am</Text>
          <Text style={styles.cardSubtext}>Cricket class with Coach Shreyas</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Open Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.cardTitle}>Coach Feedback</Text>

          <View style={styles.feedbackRow}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/2.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.feedbackTextContainer}>
              <Text style={styles.feedbackName}>Coach Vansh</Text>
              <Text style={styles.feedbackMessage}>You need to ...</Text>
              <Text style={styles.linkText}>Open Message</Text>
            </View>
          </View>

          <View style={styles.feedbackRow}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/3.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.feedbackTextContainer}>
              <Text style={styles.feedbackName}>Oscar Dum</Text>
              <Text style={styles.feedbackMessage}>email@fakedomain.net</Text>
            </View>
          </View>

          <TouchableOpacity>
            <Text style={[styles.linkText, { marginTop: 6 }]}>See all</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color="#fff" />
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="mail" size={24} color="#fff" />
        <Ionicons name="person" size={24} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff6a00",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  greeting: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  cardText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  cardSubtext: {
    fontSize: 12,
    color: "#999",
  },
  bigCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bigText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  linkText: {
    color: "#ff6a00",
    fontWeight: "bold",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  feedbackMessage: {
    fontSize: 12,
    color: "#555",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#222",
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: "#ff6a00",
    padding: 12,
    borderRadius: 32,
  },
});
