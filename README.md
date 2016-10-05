# vk-sdk
Easier way to make [vk.com API](https://vk.com/dev) requests

## Methods

| Method                                         | Returns     | Description
| ---------------------------------------------- | ----------- | -----------
| `setToken(String token)`                       | `this`      | Sets `token` which will be used for requests to VK API.
| `serverAuth(Object authParams)`                | `promise`   | Performs [Application Server Authorization](https://vk.com/dev/auth_server). `authParams` must contain `client_id` and `client_secret` properties.
| `siteAuth(Object authParams)`                  | `promise`   | Performs [Sites Authorization](https://vk.com/dev/auth_sites). `authParams` must contain `client_id`, `client_secret`, `code`, `redirect_uri` properties.
| `callMethod(String name, Object params)`       | `promise`   | Calls API method `method` with parameters `params`.
| `appendCall(String methodName, Object params)` | `promise`   | Used to delay request until `execute` method is called.
| `execute()`                                    | `promise`   | Sends by one request all delayed calls added by `appendCall` method.


## Example of usage

##### Preparation
```javascript
var vk = require('vk-sdk');

vk.setToken(/* access_token */);

```

##### Simple request
```javascript
vk.callMethod('users.get', {
    uids: [1, 5]
})
    .then(function (response) {
        console.log('Success: ' + JSON.stringify(response));
        // Success: [{"uid":1,"first_name":"Pavel","last_name":"Durov"},{"uid":5,"first_name":"Ilya","last_name":"Perekopsky"}]
    })
    .catch(function (error) {
        console.log('Fail: ' + JSON.stringify(error));
    });
```

##### Grouping several requests to a single
There are two calls of the `execute` method in the snippet below, so only two request would be sent in fact.
```javascript
vk.appendCall('users.get', {uid: 1})
    .then(function (response) {
        console.log(JSON.stringify(response));
    })
    .catch(onError);

vk.appendCall('friends.get', {uid: 1})
    .then(function (response) {
        console.log("\nFriends list: ", JSON.stringify(response));
    })
    .catch(onError);

vk.appendCall('wall.get', {owner_id: 1})
    .then(function (response) {
        console.log("\nWall posts: ", JSON.stringify(response));
    })
    .catch(onError);

vk.execute();


vk.appendCall('users.get')
    .then(function (response) {
        console.log(JSON.stringify(response));
    })
    .catch(onError);

vk.appendCall('friends.get')
    .then(function (response) {
        console.log("\nFriends list: ", JSON.stringify(response));
    })
    .catch(onError);

vk.appendCall('photos.getAlbums')
    .then(function (response) {
        console.log("\nAlbums list: ", JSON.stringify(response));
    })
    .catch(onError);

vk.execute();

function onError (error) {
    console.log(JSON.stringify(error));
}
```
