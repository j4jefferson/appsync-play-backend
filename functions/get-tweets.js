// const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const { TWEETS_TABLE } = process.env

module.exports.handler = async (event) => {
	const { userId, limit, backToken, forwardToken, hasAfter, direction } =
		event.arguments
	// const user = event.identity.username

	//get the most recent tweet
	const param = {
		KeyConditionExpression: 'creator = :userId',
		ExpressionAttributeValues: {
			':userId': userId,
		},
		TableName: TWEETS_TABLE,
		IndexName: 'byCreator',
		Limit: 1,
	}

	const tweetResp = await DocumentClient.query({
		params: param,
	}).promise()

	const latestTweetId = tweetResp.Item[0].id

	//decode/init the token for this request
	const ft = forwardToken === 'Empty' ? latestTweetId : forwardToken
	const bt = backToken === 'Empty' ? null : backToken
	const requestToken = direction === 'Forward' ? parseToken(ft) : parseToken(bt)
	const scanDirection = direction === 'Forward' ? true : false

	if (scanDirection) {
		if (!hasAfter && latestTweetId === forwardToken) {
			return
		}
	}

	//Query the DB
	let params = {
		KeyConditionExpression: 'creator = :userId',
		ExpressionAttributeValues: {
			':userId': userId,
		},
		TableName: TWEETS_TABLE,
		IndexName: 'byCreator',
		Limit: limit,
		ScanIndexForward: scanDirection,
		ExclusiveStartKey: requestToken,
	}

	const resp = await DocumentClient.query(params).promise()

	//setup the next tokens
	let returnObj
	if (scanDirection) {
		//order most recent last
		returnObj = {
			tweets: resp.Items,
			backToken,
			forwardToken: genToken(resp.LastEvaluatedKey),
			hasAfter: resp.LastEvaluatedKey === latestTweetId ? false : true,
		}
	} else {
		//order most recent first
		returnObj = {
			tweets: resp.Items,
			backToken: genToken(resp.LastEvaluatedKey),
			forwardToken: forwardToken,
			hasAfter,
		}
	}

	return {
		returnObj,
	}
}

/**
 * Parse received token
 * @param {*} tokenArg
 */
function parseToken(tokenArg) {
	if (!tokenArg) {
		return null
	}

	const t = Buffer.from(tokenArg, 'base64').toString()
	const params = JSON.parse(t)
	delete params.random

	return params
}

/**
 * Generate a new request token
 * @param {*} gt
 */
function genToken(gt) {
	if (!gt) {
		return null
	}

	const payload = Object.assign({}, gt, { random: chance.string({ length: 16 }) })
	const p = JSON.stringify(payload)
	return Buffer.from(p).toString('base64')
}
