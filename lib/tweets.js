const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const { TWEETS_TABLE } = process.env

const getTweetById = async (tweetId) => {
	const resp = await DocumentClient.get({
		TableName: TWEETS_TABLE,
		Key: {
			id: tweetId,
		},
	}).promise()

	return resp.Item
}

const extractHashTags = (text) => {
	const hashTags = new Set()
	const regex = /(\#[a-zA-Z0-9_]+\b)/gm

	while ((m = regex.exec(text)) !== null) {
		//this is necessary to prevent infinite loop with zero-index loops
		if (m.index === regex.lastIndex) {
			regex.lastIndex++
		}

		m.forEach((match) => hashTags.add(match))
	}

	return Array.from(hashTags)
}

const extractMentions = (text) => {
	const mentions = new Set()
	const regex = /@\w+/gm

	while ((m = regex.exec(text)) !== null) {
		//this is necessary to prevent infinite loop with zero-index loops
		if (m.index === regex.lastIndex) {
			regex.lastIndex++
		}

		m.forEach((match) => mentions.add(match))
	}

	return Array.from(mentions)
}

const getLatestTweetByUserId = async (userId) => {
	const resp = await DocumentClient.query({
		TableName: TWEETS_TABLE,
		KeyConditionExpression: 'creator = :userId',
		ExpressionAttributeValues: {
			':userId': userId,
		},
		IndexName: 'byCreator',
		Limit: 1,
	}).promise()

	return resp.Item
}

module.exports = {
	getTweetById,
	extractHashTags,
	extractMentions,
	getLatestTweetByUserId,
}
