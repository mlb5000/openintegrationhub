/* eslint-disable no-console */
/* eslint-disable no-undef */
process.env.AUTH_TYPE = 'basic';
const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });
const username = process.env.username;
const password = process.env.password;

let tokenAdmin = null;
let token = null;

describe('Login', () => {
    jest.setTimeout(15000);
    test.only('--- 1. LOGIN & TOKEN ---', async (done) => {
        const jsonPayload = {
			username,
			password
		};
        const Login = {
			method: 'POST',
			uri: `http://iam.openintegrationhub.com/login`,
			json: true,
			body: jsonPayload
        };
		const response = await request(Login);

		const getToken = async res => {
			try {
				token = await Promise.resolve(res.body.token);
			}
			catch (error) {
				console.log(error);
			}
			return token; 
		};	

		tokenAdmin = await getToken(response);
		module.exports.token = tokenAdmin;
		console.log("token from IAM: " + tokenAdmin);
		expect(response.statusCode).toEqual(200);
    done();
    });
});
