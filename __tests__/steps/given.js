require('dotenv').config()
const AWS = require('aws-sdk')
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const { RELATIONSHIPS_TABLE } = process.env

const a_random_user = () => {
	const firstName = chance.first({ nationality: 'en' })
	const lastName = chance.first({ nationality: 'en' })
	const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' })
	const name = `${firstName} ${lastName} ${suffix}`
	const password = chance.string({ length: 8 })
	const email = `success+${firstName}-${lastName}-${suffix}@simulator.amazonses.com`

	return {
		name,
		password,
		email,
	}
}

const an_appsync_context = (identity, args, result, source, info, prev) => {
	const util = velocityUtil.create([], new Date(), Object())
	const context = {
		identity,
		args,
		arguments: args,
		result,
		source,
		info,
		prev,
	}
	return {
		context,
		ctx: context,
		util,
		utils: util,
	}
}

const my_authenticated_user = async () => {
	const username = '5667e483-54b8-4e96-89c4-4c5d761d8c67'
	const password = 'nation123'
	const name = 'James Jefferson'
	const email = 'james@tockinsurance.com'

	const cognito = new AWS.CognitoIdentityServiceProvider()
	const clientId = process.env.WEB_USER_POOL_CLIENT_ID

	const auth = await cognito
		.initiateAuth({
			AuthFlow: 'USER_PASSWORD_AUTH',
			ClientId: clientId,
			AuthParameters: {
				USERNAME: username,
				PASSWORD: password,
			},
		})
		.promise()

	console.log(`[${email}] - has signed in`)

	return {
		username,
		name,
		email,
		idToken: auth.AuthenticationResult.IdToken,
		accessToken: auth.AuthenticationResult.AccessToken,
	}
}

const an_authenticated_user = async () => {
	const { name, email, password } = a_random_user()

	const cognito = new AWS.CognitoIdentityServiceProvider()

	const userPoolId = process.env.COGNITO_USER_POOL_ID
	const clientId = process.env.WEB_USER_POOL_CLIENT_ID

	const signUpResp = await cognito
		.signUp({
			ClientId: clientId,
			Password: password,
			Username: email,
			UserAttributes: [
				{
					Name: 'name',
					Value: name,
				},
			],
		})
		.promise()

	const username = signUpResp.UserSub

	console.log(`[${email}] - user has signed up [${username}]`)

	await cognito
		.adminConfirmSignUp({
			Username: username,
			UserPoolId: userPoolId,
		})
		.promise()

	console.log(`[${email}] - confirmed sign up`)

	const auth = await cognito
		.initiateAuth({
			AuthFlow: 'USER_PASSWORD_AUTH',
			ClientId: clientId,
			AuthParameters: {
				USERNAME: username,
				PASSWORD: password,
			},
		})
		.promise()

	console.log(`[${email}] - has signed in`)

	return {
		username,
		name,
		email,
		idToken: auth.AuthenticationResult.IdToken,
		accessToken: auth.AuthenticationResult.AccessToken,
	}
}

const a_user_follows_another = async (userId, otherUserId) => {
	await DocumentClient.put({
		TableName: RELATIONSHIPS_TABLE,
		Item: {
			userId,
			sk: `FOLLOWS_${otherUserId}`,
			otherUserId,
			createdAt: new Date().toJSON(),
		},
	}).promise()
}

module.exports = {
	a_random_user,
	an_appsync_context,
	my_authenticated_user,
	an_authenticated_user,
	a_user_follows_another,
}
