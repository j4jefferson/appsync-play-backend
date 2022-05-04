// const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const { getLatestTweetByUserId } = require('../lib/tweets')
const { TWEETS_TABLE } = process.env

module.exports.handler = async (event) => {
	const { userId, limit, backToken, forwardToken, hasAfter, direction } =
		event.arguments

	//get the most recent tweet
	const latestTweetId = getLatestTweetByUserId(userId)

	//decode/init the token for this request
	//assumption: frontend will always pass a most recent tweetId as forwardToken
	const ft = forwardToken === 'Empty' ? null : parseToken(forwardToken)
	const bt = backToken === 'Empty' ? null : parseToken(backToken)
	const requestToken = direction === 'Forward' ? ft : bt
	const scanDirection = direction === 'Forward' ? true : false

	if (scanDirection) {
		if (!hasAfter && latestTweetId === forwardToken) {
			console.log('No more future tweets right now!!')
			return
		}
	}

	//Query the DB
	let params = {
		TableName: TWEETS_TABLE,
		KeyConditionExpression: 'creator = :userId',
		ExpressionAttributeValues: {
			':userId': userId,
		},
		IndexName: 'byCreator',
		Limit: limit,
		ScanIndexForward: scanDirection,
	}
	if (requestToken !== null) {
		params = { ...params, ExclusiveStartKey: requestToken }
	}

	const resp = await DocumentClient.query(params, function (err, data) {
		if (err) console.log(err)
		else console.log(data)
	}).promise()

	//setup the next tokens
	let returnObj
	if (scanDirection) {
		//order most recent last
		console.log(`Lastevaluated key for forward search is: [${resp.LastEvaluatedKey}]`)
		const latestForwardKey =
			resp.LastEvaluatedKey === undefined ? 'Empty' : genToken(resp.LastEvaluatedKey)
		returnObj = {
			tweets: resp.Items || [],
			backToken,
			forwardToken: latestForwardKey,
			hasAfter: resp.LastEvaluatedKey === undefined ? false : true,
		}
	} else {
		//order most recent first
		console.log(
			`Lastevaluated key for backward search is: [${resp.LastEvaluatedKey}]`
		)
		console.log(resp)
		returnObj = {
			tweets: resp.Items || [],
			backToken: genToken(resp.LastEvaluatedKey),
			forwardToken: forwardToken || 'Empty',
			hasAfter: false,
		}
	}

	return returnObj
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
