module.exports = {
    'Login test': function (client) {
        client
            .url('http://localhost:3000/')
            .setValue('input[name="username"]', 'admin')
            .setValue('input[name="password"]', 'dagobahtech')
            .click('button[type="submit"]')
            .assert.containsText('main', 'Kitchen')
            .end();
    }
}