const text = 'my #hashtag is here'

const regex = /(\#[a-zA-Z0-9]+\b)/gm

while ((m = regex.exec(text)) !== null) {
	if (m.index === regex.lastIndex) {
		regex.lastIndex++
	}
	console.log(m)
}
