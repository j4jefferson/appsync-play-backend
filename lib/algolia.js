const algoliasearch = require('algoliasearch')

let usersIndex, tweetsIndex

const initUsersIndex = async (appId, key, stage) => {
	if (!usersIndex) {
		const client = algoliasearch(appId, key)
		usersIndex = client.initIndex(`users_${stage}`)
		await usersIndex.setSettings({
			attributesForFaceting: ['hashTags'],
			searchableAttributes: ['name', 'screenName', 'bio'],
		})
	}

	return usersIndex
}

const initTweetsIndex = async (appId, key, stage) => {
	if (!tweetsIndex) {
		const client = algoliasearch(appId, key)
		tweetsIndex = client.initIndex(`tweets_${stage}`)
		await tweetsIndex.setSettings({
			searchableAttributes: ['text'],
			customRanking: ['desc(createdAt)'],
		})
	}

	return tweetsIndex
}

module.exports = {
	initUsersIndex,
	initTweetsIndex,
}
