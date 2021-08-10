const { gql } = require("apollo-server-express");

module.exports = gql(`
type Comment {
  _id: String
  user: User
  commentText: String
  commentTarget: User
  deal: Deal
}

extend type Query {
    dealComments(deal_id: String): [Comment]
}

extend type Mutation {
	postComment(payload: commentPayload): Comment
  
}

input commentPayload {
  deal_id: String
  user_id: String
  commentText: String
  commentTargetId: String
}

`);
