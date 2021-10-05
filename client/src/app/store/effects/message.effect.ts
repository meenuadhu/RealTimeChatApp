import { Injectable } from "@angular/core";
import { Effect, Actions } from "@ngrx/effects";

import { Observable } from "rxjs/Observable";
import { catchError, switchMap, map, mergeMap } from "rxjs/operators";
import "rxjs/add/observable/from";
import "rxjs/add/observable/of";

import * as messageActions from "../actions/message.action";
import * as contactThreadActions from "../actions/contactThread.action";
import * as messageThreadActions from "../actions/messageThread.action";
import * as fromService from "../../services";

@Injectable()
export class MessageEffects {
  constructor(
    private actions$: Actions // private threadService: fromService.Service
  ) {}

  @Effect({ dispatch: true })
  loadMessage$ = this.actions$
    .ofType(messageActions.ADD_NEW_MESSAGE_TO_MESSAGES)
    .mergeMap((action: any) => {
      // new contactThreadActions.AddNewMessageToContactThread(action.payload);
      // console.log("add new message success effect payload", action.payload);
      // console.log("effect newMessageToMessageThread", newMessageToMessageThread);
      // console.log("message effect payload", action.payload);
      if (action.payload.group) {
        return [
          // new messageActions.AddNewMessageToMessages(action.payload),
          new messageThreadActions.AddNewMessageToMessageThread(action.payload)
        ];
      } else {
        return [
          // new messageActions.AddNewMessageToMessages(action.payload),
          new messageThreadActions.AddNewMessageToMessageThread(action.payload),
          new contactThreadActions.AddNewMessageToContactThread(action.payload)
        ];
      }
    });
}
