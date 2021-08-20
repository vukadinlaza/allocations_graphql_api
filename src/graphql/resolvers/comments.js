const { ObjectId } = require("mongodb");
const Comments = require("../schema/comments");

const Schema = Comments;

const Comment = {
  user: (comment, _, { db }) => {
    return db.collection("users").findOne({ _id: comment.user_id });
  },
  deal: (comment, _, { db }) => {
    return db.collection("deals").findOne({ _id: comment.user_id });
  },
  commentTarget: (comment, _, { db }) => {
    return db.collection("users").findOne({ _id: comment.commentTargetId });
  },
};

const Queries = {
  dealComments: async (_, { deal_id }, { db }) => {
    return db.comments.find({ deal_id: ObjectId(deal_id) }).toArray();
  },
};

const Mutations = {
  postComment: async (
    _,
    { payload: { deal_id, user_id, commentText, commentTargetId } },
    { db }
  ) => {
    const postedComment = await db.comments.insertOne({
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      commentText,
      commentTargetId: commentTargetId ? ObjectId(commentTargetId) : "",
    });
    return postedComment.ops[0];
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Comment },
};
