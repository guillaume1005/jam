# -*- coding: utf-8 -*-
#!/usr/bin/python3.8

import json
import logging
from datetime import date

from gspread import CellNotFound
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ParseMode
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackQueryHandler, ConversationHandler

from difflib import get_close_matches
import shlex

import gspread
from oauth2client.service_account import ServiceAccountCredentials

from telegram import ReplyKeyboardMarkup, Update, ReplyKeyboardRemove

from typing import Dict

from telegram_bot_calendar import DetailedTelegramCalendar, LSTEP


scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']

creds = ServiceAccountCredentials.from_json_keyfile_name('creds.json', scope)
client = gspread.authorize(creds)

# token1 = '1883945449:AAGXxMXsgYOUciS9siUC4Wzz68AdGMfHTqs'
token1 = "1640015354:AAGl1A92ftl-OMS1iaGlJHfmGvMuzouXhUY"

## datalayer
IDMARKER = 100
SAVECALLBACKID = 100
DELETEMESSAGE = []

CLASSIC, LISTEN, CALENDAR = 0, 1, 2


CHANGE_SCORE = 1
CHANGE_NOTE = 2
ADD_MEETING = 3
GET_GOOD_NAME = 4
GETALONG = 5
ADD_NOTICE = 6

must_delete = 1000

def vamos(update, context):
    calendar, step = DetailedTelegramCalendar().build()
    context.bot.send_message(update.effective_chat.id,"Select",reply_markup=calendar) #{LSTEP[step]}




def received_information(update, context):
    """Store info provided by user and ask for the next category."""

    text = update.message.text

    update.message.reply_text(
        "Neat! Just so you know, this is what you already told me:"
        "{text} You can tell me more, or change your opinion on something."
    )


def get_main_keyboard(infos):
    # keyboard = [[InlineKeyboardButton("Changer le score",
    #                                   callback_data=json.dumps({"a": CHANGE_SCORE, "d": {"id_contact": infos[0]}})),
    keyboard = [[InlineKeyboardButton("Ajouter rencontre",
                                      callback_data=json.dumps({"a": ADD_MEETING, "d": {"id_contact": infos[0]}})),
                 InlineKeyboardButton('Nouvelle note',
                                      callback_data=json.dumps({"a": ADD_NOTICE, "d": {"id_contact": infos[0]}}))],
                [InlineKeyboardButton("🟢",
                                      callback_data=json.dumps({"a": GETALONG, "d": {"id_contact": infos[0], "good": 1}})),
                InlineKeyboardButton("🔴",
                                      callback_data=json.dumps({"a": GETALONG, "d": {"id_contact": infos[0], "good": 0}}))]]


    return InlineKeyboardMarkup(keyboard) 


def get_entry(update, context):

    if not (is_allowed_user(update.message.from_user.username)):
        context.bot.send_message(chat_id=update.effective_chat.id,
                                 text='Who the hell are you @' + str(update.message.from_user.username) + ' ?')
        return
    search = ' '.join(context.args[:2])

    search_this_name(update, context, search)

    return CLASSIC


 



def search_this_name(update, context, search):
    infos, err = get_info_people(search)
    if err is not None:
        closes = find_close_names(search)
        if len(closes) > 0:
            keyboard = [[]]
            for name in closes[:4]:
                keyboard[0].append(
                    InlineKeyboardButton(name, callback_data=json.dumps({"a": GET_GOOD_NAME, "d": {"good_name": name}}))
                )
            context.bot.send_message(chat_id=update.effective_chat.id, text="Je n'ai rien trouve, vous voulez dire :",
                                     reply_markup=InlineKeyboardMarkup(keyboard)) # before
            return
        else:
            context.bot.send_message(chat_id=update.effective_chat.id, text=err)
            
    
    reply_with_infos(update, context, infos)
    
def update_this_name(update, context, id_contact, choice):
    infos = get_info_by_id(id_contact)



    global SAVECALLBACKID

    # if update.callback_query is not None:
    #     context.bot.edit_message_text(chat_id=update.callback_query.message.chat.id,
    #                   message_id=update.callback_query.message.message_id,
    #                   text=beautify_infos(infos), parse_mode=ParseMode.MARKDOWN, reply_markup=update.callback_query.message.reply_markup)
    if choice==1:
        context.bot.edit_message_text(chat_id=update.callback_query.message.chat.id,
                      message_id=update.callback_query.message.message_id,
                      text=beautify_infos(infos), parse_mode=ParseMode.MARKDOWN, reply_markup=update.callback_query.message.reply_markup)
    else:
        context.bot.edit_message_text(chat_id=SAVECALLBACKID.chat.id,
                      message_id=SAVECALLBACKID.message_id,
                      text=beautify_infos(infos), parse_mode=ParseMode.MARKDOWN, reply_markup=SAVECALLBACKID.reply_markup)

        #context.bot.delete_message(chat_id=SAVECALLBACKID.chat.id, message_id=SAVECALLBACKID.message_id) here is where is the error ?

    

def find_close_names(search):
    sheet = client.open_by_key(get_id_sheet()).sheet1
    return get_close_matches(search, sheet.col_values(3))


def reply_with_infos(update, context, infos):


    if infos[5] is not None:
        
        context.bot.send_photo(chat_id=update.effective_chat.id, photo=get_profile_picture_twitter_url(infos[5]))
        context.bot.send_message(chat_id=update.effective_chat.id, text=beautify_infos(infos),
                               parse_mode=ParseMode.MARKDOWN, reply_markup=get_main_keyboard(infos),
                               )
        

    else:
        context.bot.send_message(chat_id=update.effective_chat.id, text=beautify_infos(infos),
                                 parse_mode=ParseMode.MARKDOWN, reply_markup=get_main_keyboard(infos))

        return CLASSIC

# MAYBE CHANGE THIS IN CONVERSATION HANDLER


def button(update, context):
    print("in it #############")
    global IDMARKER
    global SAVECALLBACKID

    query = update.callback_query

    # CallbackQueries need to be answered, even if no notification to the user is needed
    # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
    query.answer()

    query = json.loads(query.data)
    action = query['a']
    datas = query['d']

    if action == CHANGE_SCORE:
        change_score(update, context, datas)
    if action == ADD_MEETING:
        # add_meeting(update, context, datas["id_contact"])

        # datalayer
        
        
        IDMARKER = datas["id_contact"]
        SAVECALLBACKID=update.callback_query.message
        vamos(update, context)
        
        return CALENDAR
    if action == GET_GOOD_NAME:
        search_this_name(update, context, datas["good_name"])
    if action == GETALONG:
        get_along(update, context, datas["id_contact"], datas["good"])
    if action == ADD_NOTICE:
        print('######@ IN ADD NOTICE')
        global must_delete
        must_delete = context.bot.send_message(chat_id=update.effective_chat.id, text="Vous pouvez rentrer le commentaire que vous voulez changer (1 seule fois):")


        # datalayer

        
        IDMARKER = datas["id_contact"]

        
        SAVECALLBACKID=update.callback_query.message
        print(update)
        return LISTEN

def add_notice(update, context):


    text=update.message.text
    update_value_for_id(IDMARKER, 25, text) # change la valeur dans la bdd

    ## update le message 

    update_this_name(update, context, IDMARKER, 0)

    global must_delete
    print(must_delete)

    context.bot.delete_message(chat_id=update.message.chat_id, message_id=update.message.message_id)

    context.bot.delete_message(chat_id = must_delete.chat.id, message_id = must_delete.message_id)

    # bot.delete(chat_id=SAVECALLBACKID.chat.id)
    return CLASSIC
    
    
    
    

def get_along(update, context, id_contact, good):
    if good==1:
        good="🟢"
    else:
        good="🔴"
    update_value_for_id(id_contact, 21, good) # change la valeur dans la bdd

    ## update le message 
    update_this_name(update, context, id_contact, 1)
    


#@bot.callback_query_handler(func=DetailedTelegramCalendar.func())
def add_meeting(update, context):
    query = update.callback_query

    # CallbackQueries need to be answered, even if no notification to the user is needed
    # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
    query.answer()
    

    print(query.data)
    
    result, key, step = DetailedTelegramCalendar().process(query.data)
    if not result and key:
        context.bot.edit_message_text("Choisissez {LSTEP[step]}",
                              query.message.chat.id,
                              query.message.message_id,
                              reply_markup=key)
    elif result:
        print(result)
        update_value_for_id(IDMARKER, 24, str(result))
        update_this_name(update, context, IDMARKER, 0)
        # context.bot.edit_message_text(f"Vous avez choisi {result}",
        #                       query.message.chat.id,
        #                       query.message.message_id)
        context.bot.delete_message(
                              query.message.chat.id,
                              query.message.message_id)
        return CLASSIC

        # maybe delete the message
                              


    #return CALENDAR

def unknown(update, context):
    context.bot.send_message(chat_id=update.effective_chat.id, text="C'est pas faux.")


def is_allowed_user(username):
    allowed_users = []
    with open("authorized_users.txt", "r") as f:
        for line in f:
            allowed_users.append(line.strip())

    if username not in allowed_users:
        return False

    return True


def get_id_sheet():
    with open("id_sheet.txt", "r") as f:
        return f.read().strip()


def get_line_people(sheet, search):
    return sheet.find(search, in_column=3).row


def get_info_by_id(id_people):
    sheet = client.open_by_key(get_id_sheet()).sheet1
    line = get_line_people_by_id(sheet, id_people)
    return sheet.row_values(line)


def get_line_people_by_id(sheet, search):
    return sheet.find(str(search), in_column=1).row


def beautify_infos(infos):

    for x in range(len(infos), 28):
        infos.append('')
    reseau = infos[1]
    qualite = infos[13]

    output = "👤*{0}*  \n" \
             "🎂_{1}_ \n"

    output = output.format(infos[1], infos[6])
    # if reseau == "Conseil LaREM":
    #     partSoutien = "`Soutien : {0}, Parainnage : {1}`\n"
    #     output = output + partSoutien.format(infos[1], infos[1])

    part2 = "-" \
            "\n*Contact* \n├{0} (pro) \n├{1}(perso) \n📱{2} \n├@{3} \n├ {4}, {5}, {6} \n" \
            "-\n"
    output = output + part2.format(infos[7].replace("_", "\_"), infos[8].replace("_", "\_"), infos[9], infos[4].replace("_", "\_"), infos[10], infos[11], infos[12])


    if qualite in ["Député", "Député européen", "Élus tirés au sort", "Président de département",
                   "Président de groupe", "Président de groupe - Elu", "Président de Région",
                   "Président EPCI", "Sénateur", "Elu"]:
        partQualite = "*Sitation* \n├{0} ({5},{6}) \n├Sensibilite : {1}\n├Commission {2}\n├{3}, {4}\n├Prox Perso {7}\n├Prox Politique {8} \n├{9} \n-\n"
        output = output + partQualite.format(infos[13], infos[17], infos[18], infos[14], infos[15], infos[19], infos[20], infos[22], infos[23], infos[21])
    # "*Scores* \n`{3}, {4}, {5} ({6})`\n" \
    
    part3 = "*Notes*\n" \
            "├_Derniere rencontre_ le _{0}_ \n" \
            "├{1}"
    

    output = output + part3.format(
        infos[24], infos[25])

    
    return output


def get_info_people(search):
    try:
        sheet = client.open_by_key(get_id_sheet()).sheet1
        line = get_line_people(sheet, search)
        return sheet.row_values(line), None

    except CellNotFound:
        return None, 'Sorry no fucking clue who u talking bout'


SCORE_1 = 22
SCORE_2 = 23
SCORE_3 = 24


def change_score(update, context, datas):
    if "score" in datas:
        context.bot.send_message(chat_id=update.effective_chat.id,
                                 text="Je change ca, chef.")
        updated_infos = update_value_for_id(datas['id_contact'], column=datas['id_score'], value=datas['score'])
        reply_with_infos(update, context, updated_infos)

        return
    if "id_score" in datas:
        keyboard = [[], []]
        for x in range(6):
            keyboard[0].append(InlineKeyboardButton("{0}".format(x), callback_data=json.dumps({
                "a": CHANGE_SCORE,
                "d": {"id_contact": datas['id_contact'], "id_score": datas['id_score'], "score": x}})))

        reply_markup = InlineKeyboardMarkup(keyboard)

        context.bot.send_message(chat_id=update.effective_chat.id, text="Quelle note ?",
                                 reply_markup=reply_markup)
        return

    infos = get_info_by_id(datas['id_contact'])
    keyboard = [[
        InlineKeyboardButton("1: ({0})".format(infos[SCORE_1]), callback_data=json.dumps(
            {"a": CHANGE_SCORE, "d": {"id_contact": infos[0], "id_score": SCORE_1}})),
        InlineKeyboardButton("2: ({0})".format(infos[SCORE_2]), callback_data=json.dumps(
            {"a": CHANGE_SCORE, "d": {"id_contact": infos[0], "id_score": SCORE_2}})),
        InlineKeyboardButton("3: ({0})".format(infos[SCORE_3]), callback_data=json.dumps(
            {"a": CHANGE_SCORE, "d": {"id_contact": infos[0], "id_score": SCORE_3}}))
    ]]

    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_message(chat_id=update.effective_chat.id, text="Quel score faut il changer ?",
                             reply_markup=reply_markup)


### fonction la plus importante qui permet de changer les trucs importants
def update_value_for_id(id_people, column, value):
    sheet = client.open_by_key(get_id_sheet()).sheet1
    line = get_line_people_by_id(sheet, id_people)
    sheet.update_cell(line, column + 1, value)
    return sheet.row_values(line)


def get_profile_picture_twitter_url(name):
    return "http://twivatar.glitch.me/" + name


def all_handler(update, context):
    msg = update.message.text
    if not msg.startswith("@TheSauronBot"):
        return
    args = shlex.split(msg)
    if args[1] == "/note":
        change_note(update, context, args[2:])
    return


def change_note(update, context, args):
    if len(args) != 2:
        return
    update_value_for_id(args[0], 25, args[1])
    context.bot.send_message(chat_id=update.effective_chat.id,
                             text="C'est fait, chef.")



# before application was main
def application(environ, start_response):
    logging.basicConfig(level=logging.WARNING,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # updater = Updater(token='973076871:AAFNjr0hjuIQXGqIOxLT86jN02lxmDpiFI4', use_context=True)

    updater = Updater(token=token1, use_context=True)

    dispatcher = updater.dispatcher

    
    dispatcher.add_handler(ConversationHandler(
        per_chat=True,
        entry_points=[CommandHandler('get', get_entry), CommandHandler('vamos', vamos)],
        states={
            CLASSIC: [
                CallbackQueryHandler(button), CommandHandler('get', get_entry)
            ],
            LISTEN: [MessageHandler(Filters.text, callback=add_notice)],
            CALENDAR: [CallbackQueryHandler(add_meeting)]
        },
        fallbacks=[CommandHandler('quit', quit)]
    ))




    # updater.dispatcher.add_handler(CallbackQueryHandler(button))



    # unknown_handler = MessageHandler(Filters.command, unknown)
    # dispatcher.add_handler(unknown_handler)

    # allHandler = MessageHandler(Filters.text, all_handler)
    # dispatcher.add_handler(allHandler)

    updater.start_polling()

    updater.idle()



if __name__ == "__main__":
    application(1,2)
