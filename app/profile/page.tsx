import React from 'react';

const user = {
  name: "Sanidhya Asthana",
  initials: "SA",
  bio: "A passionate debater with a keen interest in AI and its ethical implications.",
  email: "sanidhyaasthana@gmail.com",
};

const debateHistory = [
  { topic: "AI vs Human Creativity", date: "2025-07-28", result: "Won" },
  { topic: "Remote Work Future", date: "2025-07-25", result: "Lost" },
  { topic: "Ethics in AI", date: "2025-07-20", result: "Won" },
];

const praises = [
  "Excellent articulation in tough debates.",
  "Commands strong knowledge of AI domain.",
  "Quick thinker and strategic speaker.",
];

export default function ProfilePage() {
  return (
    <div style={styles.container}>
      <div style={styles.profileSection}>
        <div style={styles.avatar}>{user.initials}</div>
        <div>
          <h1 style={styles.name}>{user.name}</h1>
          <p style={styles.bio}>{user.bio}</p>
          <p style={styles.email}>{user.email}</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Debate History</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Date</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {debateHistory.map((debate, index) => (
              <tr key={index}>
                <td>{debate.topic}</td>
                <td>{debate.date}</td>
                <td>{debate.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Praise</h2>
        <ul>
          {praises.map((praise, index) => (
            <li key={index} style={styles.praiseItem}>🟢 {praise}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "40px",
    borderBottom: "2px solid #ddd",
    paddingBottom: "20px",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    backgroundColor: "#0047AB",
    color: "#fff",
    fontSize: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  name: {
    margin: "0",
    fontSize: "28px",
    color: "#222",
  },
  bio: {
    margin: "8px 0 4px",
    fontSize: "16px",
    color: "#666",
  },
  email: {
    margin: 0,
    fontSize: "14px",
    color: "#999",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "30px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "22px",
    color: "#333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  praiseItem: {
    padding: "8px 0",
    color: "#444",
    fontSize: "15px",
  },
};
