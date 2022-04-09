const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe('Given user A follows user B', () => {
	let userA, userB

	beforeAll(async () => {
		userA = await given.an_authenticated_user()
		userB = await given.an_authenticated_user()
		await given.a_user_follows_another(userA.username, userB.username)
	})

	describe('When user B sends a new tweet', () => {
		const tweetId = chance.guid()
		beforeAll(async () => {
			const event = require('../../data/new-tweet.json')
			const { NewImage } = event.Records[0].dynamodb
			NewImage.creator.S = userB.username
			NewImage.id.S = tweetId
			await when.we_invoke_distributeTweets(event)
		})

		it("Adds User A's tweet to User B's timeline", async () => {
			await then.tweet_exists_in_the_TimelinesTable(userA.username, tweetId)
		})
	})

	describe('When user B deletes the tweet', () => {
		const tweetId = chance.guid()
		beforeAll(async () => {
			const event = require('../../data/delete-tweet.json')
			const { OldImage } = event.Records[0].dynamodb
			OldImage.creator.S = userB.username
			OldImage.id.S = tweetId
			await when.we_invoke_distributeTweets(event)
		})

		it("Remove User B's tweet from User A's timeline", async () => {
			await then.tweet_does_not_exists_in_the_TimelinesTable(userA.username, tweetId)
		})
	})
})
