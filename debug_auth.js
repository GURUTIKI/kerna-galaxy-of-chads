
async function testRegistration() {
    const apiUrl = 'http://localhost:3001';
    const username = 'TestUser_' + Date.now();
    const password = 'password123';

    console.log(`1. Registering new user: ${username}`);
    const res1 = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const json1 = await res1.json();
    console.log('Response 1:', res1.status, json1);

    console.log(`2. Registering same user AGAIN: ${username}`);
    const res2 = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const json2 = await res2.json();
    console.log('Response 2:', res2.status, json2);
}

testRegistration();
