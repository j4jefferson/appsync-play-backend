const given = require('../../steps/given')
const when = require('../../steps/when')
const { GetDirection } = require('../../../lib/constants')

describe('Given an authenticated user', () => {
	let user
	beforeAll(async () => {
		user = await given.my_authenticated_user()
	})

	/**
	 * Testing for...
	 * If a user gets tweets then return most recent first
	 * If a user gets new (furture) tweets then return and new tweets
	 */

	it('A user should see list of tweets', async () => {
		const tweets = await when.a_user_calls_getTweets(
			user,
			user.username,
			5,
			'Empty',
			'Empty',
			false,
			GetDirection.BACKWARD
		)

		console.log(tweets)
	})
})
