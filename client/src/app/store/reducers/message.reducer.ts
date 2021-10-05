import { Message } from "../../models/message.model";

import * as fromMessage from "../actions";
import { element } from "protractor";

export interface MessageState {
  data: Message[];
  loading: boolean;
  loaded: boolean;
}

export const initialState: MessageState = {
  data: [],
  loading: false,
  loaded: false
};

export function messageReducer(
  state = initialState,
  action: fromMessage.MessageAction
): MessageState {
  switch (action.type) {
    case fromMessage.CHOOSE_MESSAGE_FROM_MESSAGE_THREAD: {
      // console.log("choose message payload", action.payload);
      // console.log("choose message state", state);

      if (action.payload) {
        if (action.payload.creator) {
          return { ...state, loading: false, loaded: true, data: [...action.payload.messages]}
        } else {
          return {
            ...state,
            loading: false,
            loaded: true,
            data: [...action.payload.messages]
          };
        }
      } else {
        return (state = initialState);
      }
    }
    case fromMessage.ADD_NEW_MESSAGE_TO_MESSAGES: {
      // console.log("Add new message to messages payload", action.payload);
      // console.log("Add new message to messages state", state);
      
      if (state.data.length) {
        if (action.payload.group) {
          return { ...state, data: [...state.data, action.payload.message] };
        } else {
            // const isInclude = function(data) {
            //   return action.payload.messageThread.chatBetween
            //     .map(element => {
            //       return element._id == data;
            //     })
            //     .includes(true);
            // };
            // console.log("new message payload", action.payload);
            // console.log("new message state", state);
            // if (isInclude(state.data[0].reciever) && isInclude(state.data[0].sender)) {
              return { ...state, data: [...state.data, action.payload.message] };
            // } else {
            //   return state;
            // }
        }
      } else {
        return { ...state, data: [action.payload.message] };
      }
    }
  }
  return state;
}

export const getMessage = (state: MessageState) => state.data;
export const getMessageLoaded = (state: MessageState) => state.loaded;
export const getMessageLoading = (state: MessageState) => state.loading;
