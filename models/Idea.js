import { DataTypes } from "sequelize";
import sequelize from "./index.js";
import User from "./User.js";

const IdeaSelection = sequelize.define("IdeaSelection", {
  team_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  list_of_ideas: {
    type: DataTypes.JSON, // array of idea names
    allowNull: false,
  },

  // store idea-wise criteria scores as JSON
  ideas_scores: {
    type: DataTypes.JSON, 
    allowNull: true,
    // Example:
    // {
    //   "Idea A": { "func": 4, "tech": 3, "appeal": 5, ... },
    //   "Idea B": { ... }
    // }
  },

  // store average score per idea (two groups) as JSON
  ideas_avg_score: {
    type: DataTypes.JSON,
    allowNull: true,
    // Example:
    // {
    //   "Idea A": { group1: 3.8, group2: 4.2 },
    //   "Idea B": { group1: 4.0, group2: 3.6 }
    // }
  },

  // overall average across all ideas
  overall_avg_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  // store the finally selected idea
  selected_idea: {
    type: DataTypes.STRING,
    allowNull: true,
  }

}, {
  tableName: "idea_selection",
  timestamps: true,
});

// Association with User
IdeaSelection.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(IdeaSelection, { foreignKey: "user_id" });

// Auto-calculate averages before save
IdeaSelection.beforeSave((record) => {
  if (record.ideas_scores) {
    const ideas_avg = {};
    let totalSum = 0;
    let totalCount = 0;

    // Define groups

    
    const group1 = ["func",  "appeal", "problem", "practical","retention", "experience"];
    const group2 = ["tech", "design", "uniqueness","degree", "scalability"];

    for (const [idea, criteria] of Object.entries(record.ideas_scores)) {
      let group1Scores = [];
      let group2Scores = [];

      for (const [crit, score] of Object.entries(criteria)) {
        if (score !== null && score !== undefined) {
          if (group1.includes(crit)) {
            group1Scores.push(score);
          } else if (group2.includes(crit)) {
            group2Scores.push(score);
          }
          totalSum += score;
          totalCount++;
        }
      }

      const avg1 = group1Scores.length > 0 ? group1Scores.reduce((a, b) => a + b, 0) / group1Scores.length : null;
      const avg2 = group2Scores.length > 0 ? group2Scores.reduce((a, b) => a + b, 0) / group2Scores.length : null;

      ideas_avg[idea] = {
        group1: avg1 !== null ? parseFloat(avg1.toFixed(2)) : null,
        group2: avg2 !== null ? parseFloat(avg2.toFixed(2)) : null,
      };
    }

    record.ideas_avg_score = ideas_avg;
    record.overall_avg_score = totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : null;
  }
});

export default IdeaSelection;
