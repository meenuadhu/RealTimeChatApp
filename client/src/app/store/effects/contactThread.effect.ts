import { Injectable } from "@angular/core";
import { Effect, Actions } from "@ngrx/effects";

import { catchError, switchMap, map } from "rxjs/operators";
import { of } from "rxjs/observable/of";

import * as contactThreadActions from "../actions/contactThread.action";
import * as fromService from "../../services";
import { AddContactToContactThread } from "../index";

@Injectable()
export class ContactThreadEffects {
  constructor(
    private actions$: Actions,
    private contactService: fromService.ContactService
  ) {}

  @Effect({ dispatch: true })
  addContactToContactThread$ = this.actions$
    .ofType(contactThreadActions.ADD_CONTACT_TO_CONTACT_THREAD)
    .pipe(
      switchMap((action: any) => {
        return this.contactService
          .addContact(action.payload)
          .pipe(
            map(
              user => {
                // console.log("add contact to contact thread effect", user)
                return new contactThreadActions.AddContactToContactThreadReady(user);
              }
            )
          );
      })
    );
}
