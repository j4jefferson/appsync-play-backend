const given = require('../../steps/given')
const when = require('../../steps/when')
const { GetDirection } = require('../../../lib/constants')
const chance = require('chance').Chance()

describe('Given an authenticated user', () => {
	let user, userTweet, tweetsPage
	const text = chance.string({ length: 16 })
	beforeAll(async () => {
		user = await given.an_authenticated_user()
		userTweet = await when.a_user_calls_tweet(user, text)
	})

	it('A user should see list of 1 tweets', async () => {
		tweetsPage = await when.a_user_calls_getTwoWayTweets(
			user,
			user.username,
			1,
			'Empty',
			'Empty',
			false,
			GetDirection.BACKWARD
		)

		expect(tweetsPage.tweets).toHaveLength(1)
		expect(tweetsPage.tweets[0]).toEqual(
			expect.objectContaining({
				id: userTweet.id,
				text: userTweet.text,
			})
		)
		expect(tweetsPage).toEqual(
			expect.objectContaining({
				backToken: null,
				forwardToken: 'Empty',
				hasAfter: false,
			})
		)
	})

	describe('When a user has more than one tweetpage', () => {
		const regex =
			/(?:^(?:[A-Za-z0-9+\/]{4}\n?)*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)$)/
		let userTweet2
		beforeAll(async () => {
			userTweet2 = await when.a_user_calls_tweet(user, chance.string({ length: 16 }))
			console.log(`User: [${user.username}] post tweet of id [${userTweet2.id}]`)
		})

		it('User should get backwardToken when searching tweets', async () => {
			tweetsPage = await when.a_user_calls_getTwoWayTweets(
				user,
				user.username,
				1,
				'Empty',
				'Empty',
				false,
				GetDirection.BACKWARD
			)

			expect(tweetsPage).toHaveProperty('backToken')
			expect(tweetsPage.backToken).toMatch(regex)
		})

		//use nextToken and get/confirm the next tweet
		it('Returns next page of tweets when passing the backward token', async () => {
			const tweetsPage2 = await when.a_user_calls_getTwoWayTweets(
				user,
				user.username,
				1,
				tweetsPage.backToken,
				'Empty',
				false,
				GetDirection.BACKWARD
			)
			expect(tweetsPage.tweets[0].id).not.toEqual(tweetsPage2.tweets[0].id)
			expect(tweetsPage2.backToken).toBeNull()
		})

		describe('When a user searches forward from the most recent tweet they have and given a newer tweet exists', () => {
			//for this test we will use the most recent tweet received from the backward search and add two new ones to test our forward search function
			let tweetsForward, tweetsForward2, userTweet3, userTweet4, tokenBuffer
			beforeAll(async () => {
				userTweet3 = await when.a_user_calls_tweet(
					user,
					chance.string({ length: 16 })
				)
				userTweet4 = await when.a_user_calls_tweet(
					user,
					chance.string({ length: 16 })
				)
				const p = Object.assign(
					{},
					{ creator: user.username, id: userTweet2.id },
					{ random: chance.string({ length: 16 }) }
				)
				const ps = JSON.stringify(p)
				tokenBuffer = Buffer.from(ps).toString('base64')
			})
			it('On first search', async () => {
				tweetsForward = await when.a_user_calls_getTwoWayTweets(
					user,
					user.username,
					1,
					'Empty',
					tokenBuffer,
					false,
					GetDirection.FORWARD
				)
				expect(tweetsForward.hasAfter).toBe(true)
				expect(tweetsForward.tweets[0].id).toEqual(userTweet3.id)
				expect(tweetsForward.forwardToken).toMatch(regex)
			})

			it('Updates the forwardToken and hasAfter flag successfully at end of forward search', async () => {
				tweetsForward2 = await when.a_user_calls_getTwoWayTweets(
					user,
					user.username,
					1,
					'Empty',
					tweetsForward.forwardToken,
					false,
					GetDirection.FORWARD
				)
				expect(tweetsForward2.hasAfter).toBe(false)
				expect(tweetsForward2.forwardToken).toMatch('Empty')
				expect(tweetsForward2.tweets[0].id).toEqual(userTweet4.id)
			})
		})
	})
})
