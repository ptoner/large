import { HomeController } from "./controllers/home-controller";
import { ProfileController } from "./controllers/profile-controller";


import { ConnectController } from "./controllers/connect-controller";
import { PostController } from "./controllers/post-controller";
import { FollowController } from "./controllers/follow-controller";
import { WalletController } from "./controllers/wallet-controller";
import Web from "large-web";
import { UiService } from "./services/ui-service";
import Core from "large-core";


export namespace Global {

  /** Controllers */
  export var homeController: HomeController
  export var postController: PostController
  export var profileController: ProfileController
  export var connectController: ConnectController
  export var followController: FollowController
  export var walletController: WalletController

  export var uiService: UiService

  /** Template7 Templates */
  export var postResultTemplate
  export var profileResultTemplate

  export var app

  export async function loadComponentState(component, showSpinner = true) {
    return Global.uiService.loadComponentState(component, showSpinner)
  }

  export function initializeControllers() {

    Global.walletController = new WalletController(Core.walletService, Global.uiService)
    Global.homeController = new HomeController(Web.quillService, Web.postUiService, Core.profileService, Core.imageService)
    Global.profileController = new ProfileController(Web.uploadService, Core.profileService, Web.postUiService, Global.uiService, Core.imageService)
    Global.followController = new FollowController(Core.friendService, Core.profileService, Core.imageService, Global.uiService)
    Global.connectController = new ConnectController(Core.ipfs)
    Global.postController = new PostController(Web.quillService, Web.postUiService, Core.profileService, Core.imageService)

    window['walletController'] = Global.walletController
    window['homeController'] = Global.homeController
    window['profileController'] = Global.profileController
    window['followController'] = Global.followController
    window['connectController'] = Global.connectController
    window['postController'] = Global.postController
  }

  export async function init() {
    await Core.initialize()
    await Web.initialize()
  }


}
