const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://daRafael:TelemovelLaikaEgirlanime99@splitnsharecluster.r1fcgs6.mongodb.net/?retryWrites=true&w=majority&appName=SplitNShareCluster";

mongoose
  .connect(MONGO_URI)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });