import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import * as io from "socket.io-client";

import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";

import * as fromStore from "../../store";
import * as fromService from "../../services";
import * as fromModel from "../../models";
import * as fromStoreSelector from "../../store/selectors";
import * as fromStoreActions from "../../store/actions";

@Component({
  selector: "app-chatroom",
  templateUrl: "./chatroom.component.html",
  styleUrls: ["./chatroom.component.css"]
})
export class ChatroomComponent implements OnInit {
  currentUser: { user: any; loaded: any; loading: any; message: any };
  chosenUser: { user: any; messageThread: { any } };
  chosenGroup: { group: any; currentUser: any };
  onlineUsers: string[];
  messages$: Observable<any>;
  messageThread$: Observable<any>;
  contactThread$: Observable<any>;
  groups$: Observable<any>;
  addContactToContactsMessage: string;
  addContactToContactsStatus: boolean;
  order: string = "username";
  statusProfileAvatar: { success: boolean; message: string };
  chosenProfileAvatar: {
    type: "userAvatar" | "defaultAvatar";
    url: string;
    submitted: boolean;
  };
  chosenGroupAvatar: {
    type: "userAvatar" | "defaultAvatar";
    url: string;
    submitted: boolean;
  };
  editGroupAvatar: {
    type: "userAvatar" | "defaultAvatar";
    url: string;
    submitted: boolean;
  };
  chosenMembersOfGroup = new Array();
  chosenMembersOfExistingGroup = new Array();
  groupMessage;
  formGroupMessage;
  formEditGroupMessage;

  formMessage: FormGroup;
  formContact: FormGroup;
  formAvatar: FormGroup;
  formCreateGroup: FormGroup;
  formEditGroup: FormGroup;

  private socket;

  constructor(
    private formBuilder: FormBuilder,
    private userService: fromService.UserService,
    private contactService: fromService.ContactService,
    private authService: fromService.AuthService,
    private threadService: fromService.ThreadService,
    private messageService: fromService.MessageService,
    private groupService: fromService.GroupService,
    private router: Router,
    private store: Store<fromStore.ChatState>
  ) {
    (() => {
      this.formMessage = this.formBuilder.group({ message: "" });
      this.formContact = this.formBuilder.group({ username: "" });
      this.formAvatar = this.formBuilder.group({ avatar: "" });
      this.formCreateGroup = this.formBuilder.group({
        groupName: [
          "",
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(30)
          ])
        ],
        groupInfo: "",
        groupAvatar: "",
        groupMember: ""
      });
      this.formEditGroup = this.formBuilder.group({ editGroupForm: "" });
    })();
  }

  ngOnInit() {
    this.socket = io.connect(
      `http://localhost:8080?token=${localStorage.getItem("token")}`
    );
    this.store.dispatch(new fromStoreActions.LoadCurrentUser());
    this.messageThread$ = this.store.select(fromStoreSelector.getMessageThread);
    this.contactThread$ = this.store.select(fromStoreSelector.getContactThread);
    this.messages$ = this.store.select(fromStoreSelector.getMessage);
    this.store.select(fromStoreSelector.getUserState).subscribe(user=>{
      this.currentUser = { user: user.data, loaded: user.loaded, loading: user.loading, message: user.message };
    })

    // ------------------------ Socket.io -------------------------------

    this.socket.on("connect", () => {
      this.socket.emit("room", localStorage.getItem("token"));
      this.socket.emit("give me online users");
      this.socket.on("online users", usersOnline => {
        this.onlineUsers = usersOnline;
      });
    });

    this.socket.on("successfully recieved from message thread", data => {
      // console.log("socket message", data);
      this.store.dispatch(
        new fromStoreActions.AddNewMessageToMessages({
          message: data.messageSent,
          messageThread: data.messageThread
        })
      );
    });
    this.socket.on("successfully sent from message thread", data => {
      // console.log("socket message", data);
      this.store.dispatch(
        new fromStoreActions.AddNewMessageToMessages({
          message: data.messageSent,
          messageThread: data.messageThread
        })
      );
      this.store.dispatch(
        new fromStoreActions.AddUnreadMessageToMessageThread({
          message: data.messageSent,
          messageThread: data.messageThread,
          currentUser: this.currentUser.user
        })
      );
    });
    this.socket.on("successfully recieved from group", data => {
      // console.log("socket message", data);
      this.store.dispatch(
        new fromStoreActions.AddNewMessageToMessages({
          message: data.messageSent,
          group: data.group
        })
      );
    });
    this.socket.on("successfully sent from group", data => {
      // console.log("socket message", data);
      this.store.dispatch(
        new fromStoreActions.AddNewMessageToMessages({
          message: data.messageSent,
          group: data.group
        })
      );
      this.store.dispatch(
        new fromStoreActions.AddUnreadMessageToMessageThread({
          message: data.messageSent,
          group: data.group,
          currentUser: this.currentUser.user
        })
      );
    });
    this.socket.on("new group success", data => {
      // console.log("socket io recieved group", data);
      this.store.dispatch(new fromStoreActions.NewGroup(data.group));
    });
    this.socket.on("exception", data => {
      // console.log(data);
    });
  }
  // ------------------- Files ---------------------
  handleAvatarFileSelect = function(evt, callback) {
    // console.log("evt inside", evt);
    var files = evt.target.files;
    for (var i = 0, f; (f = files[i]); i++) {
      if (!f.type.match("image.*")) {
        return false;
      } else {
        var reader = new FileReader();
        reader.readAsDataURL(f);
        setTimeout(() => {
          callback(reader.result);
        }, 100);
      }
    }
  };
  chosenGroupModalInputChange(event) {
    var that = this;
    // console.log("event", event);
    this.handleAvatarFileSelect(event, function(result) {
      that.editGroupAvatar = {
        type: "userAvatar",
        url: result,
        submitted: false
      };
    });
    // console.log("this.editGroupAvatar", this.chosenProfileAvatar);
  }
  avatarModalChange(event) {
    // console.log("event", event);
    this.handleAvatarFileSelect(event, (result) => {
      this.chosenProfileAvatar = {
        type: "userAvatar",
        url: result,
        submitted: false
      };
    });
    // console.log("this.editGroupAvatar", this.chosenProfileAvatar);
  }
  createGroupModalChange(event) {
    var that = this;
    // console.log("event", event);
    this.handleAvatarFileSelect(event, function(result) {
      that.chosenGroupAvatar = {
        type: "userAvatar",
        url: result,
        submitted: false
      };
    });
    // console.log("this.editGroupAvatar", this.chosenProfileAvatar);
  }

  chooseUserFromMessageThread(user) {
    // console.log("user", user);
    if (user.creator && user.members.length) {
      this.chosenUser = null;
      // console.log("group thead user", user);
      this.chosenGroup = { group: user, currentUser: this.currentUser.user };
      // console.log("group thead chosen group", this.chosenGroup);
      this.store.dispatch(
        new fromStoreActions.ChooseMessageFromMessageThread(
          this.chosenGroup.group
        )
      );
      this.store.dispatch(
        new fromStoreActions.RemoveUnreadMessageFromMessageThread(
          this.chosenGroup
        )
      );
    } else {
      this.chosenGroup = null;
      let chosenUserFromMessageThread = user.chatBetween.filter(
        userInChatBetween => {
          return userInChatBetween._id != this.currentUser.user._id;
        }
      );
      // console.log("message thead user", user);
      this.chosenUser = {
        user: chosenUserFromMessageThread[0],
        messageThread: user
      };
      // console.log("message thead chosen user", this.chosenUser);
      this.store.dispatch(
        new fromStoreActions.ChooseMessageFromMessageThread(
          this.chosenUser.messageThread
        )
      );
      this.store.dispatch(
        new fromStoreActions.RemoveUnreadMessageFromMessageThread({
          messageThread: this.chosenUser.messageThread,
          currentUser: this.currentUser.user
        })
      );
    }
  }
  chooseUserFromContactThread(user) {
    // console.log("user", user);
    this.chosenGroup = null;
    if (user.messageThread.length > 0) {
      let ourMessageThread = user.messageThread.filter(thread => {
        return this.currentUser.user.messageThread
          .map(currentThread => {
            return currentThread._id == thread._id;
          })
          .includes(true);
      });
      if (ourMessageThread) {
        // console.log("ourMessageThread", ourMessageThread);
        // console.log("contact user", user);
        this.chosenUser = { user: user, messageThread: ourMessageThread[0] };
        // console.log("contact chosen user", this.chosenUser);
        this.store.dispatch(
          new fromStoreActions.ChooseMessageFromMessageThread(
            this.chosenUser.messageThread
          )
        );
      } else {
        // console.log("you do not have shared message thread with this user");
      }
    } else {
      this.chosenUser = { user: user, messageThread: undefined };
      this.store.dispatch(
        new fromStoreActions.ChooseMessageFromMessageThread(
          this.chosenUser.messageThread
        )
      );
    }
  }

  sendMessage() {
    if (this.chosenGroup && this.chosenGroup.group) {
      this.socket.emit("sendMessage", {
        token: localStorage.getItem("token"),
        reciever: this.chosenGroup.group,
        message: this.formMessage.get("message").value
      });
      this.formMessage.reset();
    } else {
      this.socket.emit("sendMessage", {
        token: localStorage.getItem("token"),
        reciever: this.chosenUser.user,
        message: this.formMessage.get("message").value
      });
      this.formMessage.reset();
    }
  }

  addContact() {
    var user = {
      username: this.formContact.get("username").value
    };
    if (user.username) {
      this.store.dispatch(new fromStoreActions.AddContactToContactThread(user));
      this.store
        .select(fromStoreSelector.getContactThreadState)
        .subscribe(state => {
          // console.log("contact thread state", state);
          if (state.loading) {
            this.disableForm();
          } else {
            if (state.loaded) {
              this.addContactToContactsMessage = state.message;
              this.addContactToContactsStatus = state.loaded;
              setTimeout(() => {
                this.enableForm();
                this.formContact.reset();
                this.addContactToContactsMessage = "";
                $("#contactModal").modal("hide");
              }, 500);
            } else {
              this.addContactToContactsMessage = state.message;
              this.addContactToContactsStatus = state.loaded;
              this.enableForm();
            }
          }
        });
    } else {
      this.addContactToContactsMessage = "Please enter a username";
      this.addContactToContactsStatus = false;
    }
  }

  disableForm() {
    // console.log("disable working")
    this.formContact.controls["username"].disable();
  }
  enableForm() {
    // console.log("enable working")
    this.formContact.controls["username"].enable();
  }
  modalClosed() {
    this.formContact.reset();
    this.addContactToContactsMessage = "";
  }

  avatarFormSubmitted(event) {
    this.chosenProfileAvatar = { ...this.chosenProfileAvatar, submitted: true };
    if (
      this.chosenProfileAvatar
    ) {
      let inputEvent = event.target[0];
      this.userService.changeAvatar(inputEvent).subscribe(data => {
        this.statusProfileAvatar = data;
        if (data.success) {
          // console.log('data success', data);
          setTimeout(() => {
            this.clearAvatarPageAndBackToProfile();
          }, 1000);
        }
      });
    } else {
        this.statusProfileAvatar = {
          success: false,
          message: "Please select a image"
        };
      }
    }
  
  chosenProfileAvatarDefault(imageName) {
    this.chosenProfileAvatar = {
      type: "defaultAvatar",
      url: "./assets/images/" + imageName,
      submitted: false
    };
  }
  clearAvatarPageAndBackToProfile() {
    if (this.chosenProfileAvatar.submitted) {
      // console.log("chosen avatar1", this.chosenProfileAvatar);
      this.formAvatar.reset();
      this.statusProfileAvatar = null;
      $("#avatarModal").modal("hide");
      $("#profileModal").modal("show");
    } else {
      // console.log("chosen avatar2", this.chosenProfileAvatar);
      this.formAvatar.reset();
      this.chosenProfileAvatar = null;
      this.statusProfileAvatar = null;
      $("#avatarModal").modal("hide");
      $("#profileModal").modal("show");
    }
  }
  avatarModalBack() {
    this.clearAvatarPageAndBackToProfile();
  }
  avatarModalClose() {
    this.clearAvatarPageAndBackToProfile();
  }
  changeAvatarModal() {
    // $("#profileModal").modal("hide");
    $("#avatarModal").modal("show");
  }
  addContactsToMembers() {
    $("#createGroupModal").modal("hide");
    $("#addMemberToModal").modal("show");
  }
  chosenContactToMembers(contact) {
    if (this.chosenMembersOfGroup && this.chosenMembersOfGroup.length) {
      const hasContact = contact => {
        return this.chosenMembersOfGroup
          .map(contactInList => {
            return contactInList._id == contact._id;
          })
          .includes(true);
      };
      if (!hasContact(contact)) {
        this.chosenMembersOfGroup.push(contact);
        // console.log("new contact", this.chosenMembersOfGroup);
        return true;
      } else {
        this.chosenMembersOfGroup.splice(
          this.chosenMembersOfGroup.indexOf(contact),
          1
        );
        // console.log("delete", this.chosenMembersOfGroup);
        return false;
      }
    } else {
      this.chosenMembersOfGroup.push(contact);
      // console.log("first contact", this.chosenMembersOfGroup);
      return true;
    }
  }
  isChosen(contact) {
    if (this.chosenMembersOfExistingGroup.length) {
      const hasContact = contact => {
        return this.chosenMembersOfExistingGroup
          .map(contactInList => {
            return contactInList._id == contact._id;
          })
          .includes(true);
      };
      // console.log("hasContact(contact) existing", hasContact(contact));
      if (hasContact(contact)) {
        return true;
      } else {
        return false;
      }
    } else {
      if (this.chosenMembersOfGroup.length) {
        const hasContact = contact => {
          return this.chosenMembersOfGroup
            .map(contactInList => {
              return contactInList._id == contact._id;
            })
            .includes(true);
        };
        // console.log("hasContact(contact)", hasContact(contact));
        if (hasContact(contact)) {
          return true;
        } else {
          return false;
        }
      }
    }
  }
  addUsernameToMembers() {
    let userToAddToGroup = this.formCreateGroup.get("groupMember").value;
    this.formCreateGroup.get("groupMember").reset();
    let hasMember = this.chosenMembersOfGroup
      .map(member => {
        return member.username == userToAddToGroup;
      })
      .includes(true);
    if (hasMember) {
      this.groupMessage = "The user has already added";
    } else {
      this.userService.userExist(userToAddToGroup).subscribe(data => {
        this.groupMessage = data.message;
        if (data.success) {
          this.chosenMembersOfGroup.push(data.user);
        }
      });
    }
  }
  addMemberToModalBack() {
    this.chosenMembersOfGroup = [];
    $("#addMemberToModal").modal("hide");
    $("#createGroupModal").modal("show");
  }
  addMemberToModalSubmit() {
    $("#addMemberToModal").modal("hide");
    $("#createGroupModal").modal("show");
  }
  deleteMember(member) {
    this.chosenMembersOfGroup.splice(
      this.chosenMembersOfGroup.indexOf(member),
      1
    );
  }
  groupFormSubmitted(event) {
    let groupInfoValue = this.formCreateGroup.get("groupInfo").value;
    let groupNameValue = this.formCreateGroup.get("groupName").value;
    let groupMember = this.chosenMembersOfGroup;
    let groupAvatar = event.target[0].files[0];
    let groupFormData = {
      name: groupNameValue,
      members: groupMember,
      avatar: groupAvatar,
      description: groupInfoValue
    };
    if (!groupNameValue) {
      this.formGroupMessage = "Name of group is required";
    } else {
      this.groupService.newGroup(groupFormData).subscribe(data => {
        this.formGroupMessage = data.message;
        if (data.success) {
          this.socket.emit("new group", { group: data.group });
          setTimeout(() => {
            $("#createGroupModal").modal("hide");
          }, 500);
        }
      });
    }
  }
  addMemberToExistingGroup() {
    $("#chosenUserModal").modal("hide");
    $("#userToGroup").modal("show");
  }
  chooseMemberToExistingGroup(chosenMember) {
    // console.log("chosen member", chosenMember);
    let hasMember = this.chosenMembersOfExistingGroup
      .map(member => {
        return member._id == chosenMember._id;
      })
      .includes(true);
    if (hasMember) {
      this.chosenMembersOfExistingGroup.splice(
        this.chosenMembersOfExistingGroup.indexOf(chosenMember),
        1
      );
      // console.log(
        // "chosen members of existing group",
        // this.chosenMembersOfExistingGroup
      // );
    } else {
      this.chosenMembersOfExistingGroup.push(chosenMember);
      // console.log(
        // "chosen members of existing group",
        // this.chosenMembersOfExistingGroup
      // );
    }
  }
  chooseMemberToExistingGroupChoose(currentGroup) {
    // console.log("current group", currentGroup);
    // console.log(
      // "chosen members of existing group",
      // this.chosenMembersOfExistingGroup
    // );
    let memberToAdd = this.chosenMembersOfExistingGroup.filter(member => {
      // console.log("member", member);
      let toAdd = !currentGroup.members
        .map(memberOfGroup => {
          // console.log("member of group", memberOfGroup);
          // console.log(
            // "member._id != memberOfGroup._id",
            // member._id != memberOfGroup._id
          // );
          return member._id != memberOfGroup._id;
        })
        .includes(false);
      // console.log("toAdd", toAdd);
      return toAdd;
    });
    // console.log("memberToAdd", memberToAdd);
    if (memberToAdd.length) {
      currentGroup.members.push(...memberToAdd);
      this.chosenMembersOfExistingGroup = [...memberToAdd];
    } else {
      // console.log("memberToAdd", memberToAdd);
      this.chosenMembersOfExistingGroup = [...memberToAdd];
      // console.log(
      // "chosenMembersOfExistingGroup after",
      // this.chosenMembersOfExistingGroup
      // );
    }

    $("#userToGroup").modal("hide");
    $("#chosenUserModal").modal("show");
  }
  formGroupInfoSubmitted(event, currentGroup) {
    // console.log("event", event);
    // console.log("currentGroup", currentGroup);
    let formEditAvatar = event.target[0].files[0];
    let formEditMembers = this.chosenMembersOfExistingGroup;
    // console.log("formEditAvatar", formEditAvatar);
    // console.log("formEditMembers", formEditMembers);
    if (formEditAvatar || formEditMembers.length) {
      if (formEditAvatar) {
        // console.log("formEditAvatar", formEditAvatar);
        // console.log("formEditMembers", formEditMembers);
        let formEditGroup = {
          avatar: formEditAvatar,
          members: formEditMembers,
          currentGroupId: currentGroup._id
        };
        this.groupService.editGroup(formEditGroup).subscribe(data => {
          // console.log("data", data);
          this.formEditGroupMessage = data.message;
          if (data.success) {
            this.socket.emit("new group", {
              group: data.group,
              addedUser: formEditGroup.members
            });
            setTimeout(() => {
              $("#chosenUserModal").modal("hide");
            }, 500);
          }
        });
      } else {
        let formEditGroup = {
          members: formEditMembers,
          currentGroupId: currentGroup._id
        };
        this.groupService.editGroup(formEditGroup).subscribe(data => {
          // console.log("data", data);
          this.formEditGroupMessage = data.message;
          if (data.success) {
            this.socket.emit("new group", {
              group: data.group,
              addedUser: formEditGroup.members
            });
            setTimeout(() => {
              $("#chosenUserModal").modal("hide");
            }, 500);
          }
        });
      }
    } else {
      this.formEditGroupMessage = "Nothing was edited";
    }
  }
  chooseMemberToExistingGroupBack() {
    this.chosenMembersOfExistingGroup = [];
  }
  createGroupModalBack() {
    this.chosenGroupAvatar = null;
    this.formCreateGroup.reset();
  }
  logout() {
    localStorage.clear();
    setTimeout(() => {
      this.router.navigate(["/login"]);
    });
  }
}
