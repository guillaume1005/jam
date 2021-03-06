const { GeneratedAPIs } = require('googleapis/build/src/apis');
const TelegramBot = require('node-telegram-bot-api');


const token = '1640015354:AAGl1A92ftl-OMS1iaGlJHfmGvMuzouXhUY';

console.log(token)


const bot = new TelegramBot(token, { polling: true });

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; // https://www.googleapis.com/auth/spreadsheets.readonly if we want just readonly
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// const great = require('./google')




function authorize(credentials, callback, chatId, resp) {

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback()); // we generate a new token
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, chatId, resp); // this is called to do the telegram function
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
// function listMajors(auth, chatId) {
//     const sheets = google.sheets({ version: 'v4', auth });
//     sheets.spreadsheets.values.get({
//         spreadsheetId: '1GHQSXdiQ-7sHV_tcfUMbjGIRQ4HH5D_bKuDjUPZGYp0', // identifiant du spreadshit
//         range: 'A2:E6', // lignes ou code particulier
//     }, (err, res) => {
//         if (err) return console.log('The API returned an error: ' + err);
//         const rows = res.data.values;
//         if (rows.length) {
//             // Print columns A and E, which correspond to indices 0 and 4.
//             rows.map((row) => {
//                 var boss = [row[0], row[1], row[2], row[3]]
//                 bot.sendMessage(chatId, `${boss}`); // what is sent back
//             });
//         } else {
//             console.log('No data found.');

//         }
//     });
// }

///////////////////////////////////////////////////// GET ALL THE CATEGORIES AND DISPLAY THEM ///////////////////////////////////////////////:
function listMajorsEconomie(auth, chatId, resp) {
    const sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: '1GHQSXdiQ-7sHV_tcfUMbjGIRQ4HH5D_bKuDjUPZGYp0', // identifiant du spreadshit
        range: 'A2:E6', // lignes ou code particulier
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values; // lignes
        if (rows.length) {
            // Print columns A and E, which correspond to indices 0 and 4, in the for loop below
            // matrice qui contient tout
            listeEconomie = []
            rows.map((row) => {
                // boucle pour chaque ligne
                var category = row[0] // filter according to the category
                // console.log(category)
                console.log(resp)

                if (category == resp) {


                    listeEconomie.push(row)

                }


            });
            // filter done in each row
            listeTitre = []
            listeEconomie.map((ligne) => listeTitre.push(ligne[1])) // we enter all the titles



            ///////////////////////////////// listeEconomie contains our title, now we DISPLAY BUTTONS /////////////////

            // push the list of one object
            objectList = []
            listeTitre.forEach((title) => {
                objectList.push([
                    {
                        text: title,
                        callback_data: JSON.stringify({
                            'title': title,
                            'id': 2
                        })
                    }
                ])
            });

            const opts = {
                reply_markup: {
                    inline_keyboard: objectList
                },
                parse_mode: 'Markdown'
            };

            bot.sendMessage(chatId, '*Choisissez le titre voulu*', opts); // chatId gives the good user




            // bot.sendMessage(chatId, `${listeTitre}`); // what is sent back

        } else {
            console.log('No data found.');

        }
    });
}

bot.on('new_chat_members', (msg) => {
    bot.sendMessage(msg.chat.id, 'Welcome');
});



/////////////////////////////////////////////////////////// DISPLAY THE RIGHT TOPIC /////////////////////////////////////
function getTheRightTopic(auth, chatId, resp) {
    // auth for google, chatId for user, resp for the topic
    const sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: '1GHQSXdiQ-7sHV_tcfUMbjGIRQ4HH5D_bKuDjUPZGYp0', // identifiant du spreadshit
        range: 'A2:E6', // lignes ou code particulier
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values; // lignes
        if (rows.length) {
            ///// check in all the rows if it is the right topic
            var sheet = ''
            rows.map((row) => {
                // loop for each row
                var topic = row[1]
                // filter according to the topic
                if (topic == resp) {

                    sheet = row[3]

                }

            });

            console.log(sheet)


            bot.sendMessage(chatId, sheet); // chatId gives the good user




            // bot.sendMessage(chatId, `${listeTitre}`); // what is sent back

        } else {
            console.log('No data found.');

        }
    });
}

// Matches "/echo [whatever]"
bot.onText(/\/push (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id; // this is where we send the messages
    const resp = match[1]; // the captured "whatever", the match allows to get the what's after the slash

    // we directly get what the user types in for the category

    console.log(resp)

    /// authenticate on google sheet 

    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), getPush, chatId, resp)
    });




    // If modifying these scopes, delete token.json.



    // send back the matched "whatever" to the chat


    // bot.sendPhoto to
});

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // send a message to the chat acknowledging receipt of their message
//     bot.sendMessage(chatId, 'booooooommm');
// });




/////////////////////////////////////////////////////////// DISPLAY WHAT THE USER WILL SEE /////////////////////////////////////



// bot.onText(/\/attaque/, function onEditableText(msg) {
//     const opts = {
//         reply_markup: {
//             inline_keyboard: [
//                 [
//                     {
//                         text: 'Economie',
//                         // we shall check for this value when we listen
//                         // for "callback_query"
//                         callback_data: JSON.stringify({
//                             category: 'Economie',
//                             id: 1
//                         })
//                     }
//                 ],
//                 [
//                     {
//                         text: 'Education',
//                         // we shall check for this value when we listen
//                         // for "callback_query"
//                         callback_data: JSON.stringify({
//                             category: 'Education',
//                             id: 1
//                         })
//                     }
//                 ],
//                 [
//                     {
//                         text: 'Tourisme',
//                         // we shall check for this value when we listen
//                         // for "callback_query"
//                         callback_data: JSON.stringify({
//                             category: 'Tourisme',
//                             id: 1
//                         })
//                     }
//                 ],
//                 [
//                     {
//                         text: 'Social',
//                         // we shall check for this value when we listen
//                         // for "callback_query"
//                         callback_data: JSON.stringify({
//                             category: 'Social',
//                             id: 1
//                         })
//                     }
//                 ],
//                 [
//                     {
//                         text: 'Ethique',
//                         // we shall check for this value when we listen
//                         // for "callback_query"
//                         callback_data: JSON.stringify({
//                             category: 'Ethique',
//                             id: 1
//                         })
//                     }
//                 ],

//             ]
//         },
//         parse_mode: 'Markdown'
//     };
//     bot.sendMessage(msg.chat.id, '*Choisissez le sujet voulu*', opts);
// });



///////////////////////////////////////////////// BOT MESSAGE D'ACCUEIL ///////////////////////////////////////////

bot.onText(/\/start/, function boss(msg) {


    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), sendWelcome, msg.chat.id, '')
    });


})


function sendWelcome(auth, chatId, resp) {
    // auth for google, chatId for user, resp for the topic
    const sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: '1GHQSXdiQ-7sHV_tcfUMbjGIRQ4HH5D_bKuDjUPZGYp0', // identifiant du spreadshit
        range: 'A2:F6', // lignes ou code particulier
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values; // lignes
        if (rows.length) {
            ///// check on the first line
            var text = rows[0][4]

            ////// HERE WE SEE ON WHICH BUTTON THE USER TAPS ON TELEGRAM FOR THE POLITIC BOT ACTIONMACRON
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Push',
                                // we shall check for this value when we listen
                                // for "callback_query"
                                callback_data: JSON.stringify({
                                    category: 'Economie',
                                    id: 3
                                })
                            }
                        ],
                        [
                            {
                                text: 'Cat??gories',
                                // we shall check for this value when we listen
                                // for "callback_query"
                                callback_data: JSON.stringify({
                                    category: 'Education',
                                    id: 0
                                })
                            }
                        ],
                        [
                            {
                                text: 'Recherche',
                                // we shall check for this value when we listen
                                // for "callback_query"
                                callback_data: JSON.stringify({
                                    category: 'Education',
                                    id: 4
                                })
                            }
                        ]

                    ]
                },
                parse_mode: 'Markdown'
            };
            bot.sendMessage(chatId, `*${text}*`, opts);




            // bot.sendMessage(chatId, `${listeTitre}`); // what is sent back

        } else {
            console.log('No data found.');

        }
    });
}

////////////////////////////////////////////////////// PUSH /////////////////////////////////////////////////////////////////

function getPush(auth, chatId, resp) {



    const sheets = google.sheets({ version: 'v4', auth });


    let values = [
        [
            `${resp}`

        ],
        // Additional rows ...
    ];

    const resource = {
        values,
    };

    sheets.spreadsheets.values.append({
        spreadsheetId: '1GHQSXdiQ-7sHV_tcfUMbjGIRQ4HH5D_bKuDjUPZGYp0',
        range: 'test2!A1',
        valueInputOption: 'RAW',
        resource,
    }, (err, result) => {
        if (err) {
            // Handle error
            console.log(err);
        } else {
            console.log('%d cells updated.', result.updatedCells);
        }
    });






}




///////////////////////////////////////////////////// CALLBACK QUERIES /////////////////////////////////////////////////////

// this is the callback query for the category chosen
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    var action = callbackQuery.data; // this is a json string
    action = JSON.parse(action);

    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };

    if (action.id === 0) {
        ///// DISPLAY THE LIST OF BUTTONS OF CATEGORIES
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Economie',
                            // we shall check for this value when we listen
                            // for "callback_query"
                            callback_data: JSON.stringify({
                                category: 'Economie',
                                id: 1
                            })
                        }
                    ],
                    [
                        {
                            text: 'Education',
                            // we shall check for this value when we listen
                            // for "callback_query"
                            callback_data: JSON.stringify({
                                category: 'Education',
                                id: 1
                            })
                        }
                    ],
                    [
                        {
                            text: 'Tourisme',
                            // we shall check for this value when we listen
                            // for "callback_query"
                            callback_data: JSON.stringify({
                                category: 'Tourisme',
                                id: 1
                            })
                        }
                    ],
                    [
                        {
                            text: 'Social',
                            // we shall check for this value when we listen
                            // for "callback_query"
                            callback_data: JSON.stringify({
                                category: 'Social',
                                id: 1
                            })
                        }
                    ],
                    [
                        {
                            text: 'Ethique',
                            // we shall check for this value when we listen
                            // for "callback_query"
                            callback_data: JSON.stringify({
                                category: 'Ethique',
                                id: 1
                            })
                        }
                    ],

                ]
            },
            parse_mode: 'Markdown'
        };
        bot.sendMessage(msg.chat.id, '*Choisissez le sujet voulu*', opts);
    }

    // print states to display multiple buttons
    if (action.id === 1) { // THIS IS WHAT IS DONE WHEN WE CLICK ON THE CATEGORY OF THE LIST OF CATEGORIES

        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), listMajorsEconomie, msg.chat.id, action.category) // this is the callback
        });



    }

    if (action.id === 2) { // display the second LIST OF button


        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), getTheRightTopic, msg.chat.id, action.title)
        });

    }

    ///////////////////////////////////////////////////////////////////// display  PUSHING METHOD//////////////////////////////////////////////
    if (action.id === 3) { // DISPLAY THE PUSHING METHOD


        // fs.readFile('credentials.json', (err, content) => {
        //     if (err) return console.log('Error loading client secret file:', err);
        //     // Authorize a client with credentials, then call the Google Sheets API.
        //     // authorize(JSON.parse(content), getPush, 'msg.chat.id', 'action.title')

        // });

        bot.sendMessage(msg.chat.id, '*??crivez avec un "/push" devant la phrase que vous ??crivez le sujet que vous souhaitez faire remonter*, par exemple /bim La CSG est mal per??ue dans le nord', opts);

    }

    if (action.id === 4) { // display the second button


        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), getTheRightTopic, msg.chat.id, action.title)
        });

    }

    if (action.id === 5) { // display the second button


        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), getTheRightTopic, msg.chat.id, action.title)
        });

    }


    // bot.editMessageText(text, opts);
});
