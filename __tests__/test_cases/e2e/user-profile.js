require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()
const path = require('path')

describe('Given an authenticated user', () => {
	let user, profile
	beforeAll(async () => {
		user = await given.an_authenticated_user()
	})

	it('The user can fetch his profile with getMyProfile', async () => {
		profile = await when.a_user_calls_getMyProfile(user)

		expect(profile).toMatchObject({
			id: user.username,
			name: user.name,
			imageUrl: null,
			backgroundImageUrl: null,
			bio: null,
			location: null,
			website: null,
			birthdate: null,
			createdAt: expect.stringMatching(
				/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
			),
			followersCount: 0,
			followingCount: 0,
			tweetsCount: 0,
			likesCounts: 0,
			tweets: {
				nextToken: null,
				tweets: [],
			},
		})

		const [firstName, lastName] = profile.name.split(' ')
		expect(profile.screenName).toContain(firstName)
		expect(profile.screenName).toContain(lastName)
	})

	it('The user can fetch an OtherProfile', async () => {
		//STEPS
		/*
			1. Create another user
			2. Get the other user screenName
			2. Fetch other user and check object
		*/
		const testOtherProfile = {
			id: 'f3899242-7606-47b9-8f75-b9385399266e',
			name: 'Erik Harriett jvki',
			screenName: 'ErikHarriettjvki5PK5K6PI',
		}

		const otherProfile = await when.a_user_calls_getProfile(
			user,
			testOtherProfile.screenName
		)

		expect(otherProfile).toMatchObject({
			id: testOtherProfile.id,
			name: testOtherProfile.name,
			imageUrl: null,
			backgroundImageUrl: null,
			bio: null,
			location: null,
			website: null,
			birthdate: null,
			createdAt: expect.stringMatching(
				/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
			),
			followersCount: 0,
			followingCount: 0,
			tweetsCount: 0,
			likesCounts: 0,
			tweets: {
				nextToken: null,
				tweets: [],
			},
		})
	})

	it('The user can get an URL to upload a new profile inmage', async () => {
		const uploadUrl = await when.a_user_calls_getImageUploadUrl(
			user,
			'.png',
			'image/png'
		)

		const { BUCKET_NAME } = process.env
		const regex = new RegExp(
			`https://${BUCKET_NAME}.s3-accelerate.amazonaws.com/${user.username}/.*\.png\?.*Content-Type=image%2Fpng.*`
		)
		expect(uploadUrl).toMatch(regex)

		const filePath = path.join(__dirname, '../../data/logo.png')
		await then.user_can_upload_image_to_url(uploadUrl, filePath, 'image/png')

		const downloadUrl = uploadUrl.split('?')[0]
		await then.user_can_download_image_from(downloadUrl)
	})

	it('The user can edit his profile with editMyProfile', async () => {
		const newName = chance.first()

		const input = {
			name: newName,
		}
		const newProfile = await when.a_user_calls_editMyProfile(user, input)

		expect(newProfile).toMatchObject({
			...profile,
			name: newName,
		})
	})
})
