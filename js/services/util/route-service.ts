import { SettingsService } from "./settings-service";
import { Global } from "../../global";
import { Template7 } from "framework7";
import { ModelView } from "../../model-view";

const IPFS = require('ipfs')
const ipfsClient = require('ipfs-http-client')

const OrbitDB = require('orbit-db')
const TableStore = require('orbit-db-tablestore')
const Keystore = require('orbit-db-keystore/index-browser')



const { ethers } = require('ethers')

// const level = require('level-js')


import * as Whitepages from '../../../truffle/build/contracts/Whitepages.json'
import { HomeController } from "../../controllers/home-controller";
import { PublicPostService } from "../public-post-service";
import { QuillService } from "./quill-service";
import { ProfileService } from "../profile-service";
import { ProfileController } from "../../controllers/profile-controller";
import { SettingsController } from "../../controllers/settings-controller";
import { UploadService } from "./upload-service";
import { IdentityService } from "./identity-service";
import { Schema } from "../../dto/schema";
import { SchemaService } from "./schema-service";
import { WhitepagesService } from "../whitepages-service";
import { ConnectController } from "../../controllers/connect-controller";
import { ListingService } from "../listing-service";
import { PostController } from "../../controllers/post-controller";
import { FriendService } from "../friend-service";
import { ProcessFeedService } from "../process-feed-service";
import { FollowController } from "../../controllers/follow-controller";
import { PostUIService } from "../post-ui-service";
import { ImageService } from "./image-service";
import { WalletController } from "../../controllers/wallet-controller";
import { WalletService } from "../wallet-service";


const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res);
    })
  );


class RouteService {

  constructor(
    private settingsService: SettingsService,
    private identityService: IdentityService,
    private schemaService: SchemaService
  ) { }


  getRoutes(baseurl) {

    const self = this

    window['settingsController'] = Global.settingsController

    const homeRoute = async function (routeTo, routeFrom, resolve, reject) {

      self.initAndResolve(resolve, function () {

        if (Global.isElectron) {
          
          if (window['currentAccount']) {
            return Global.homeController.showHomePage()
          } else {
            return Global.walletController.showLanding()
          }

        } else {
          return Global.homeController.showHomePage()
        }

      })

    }

    let routes = []

    if (baseurl != '/') {
      routes.push({
        path: baseurl,
        async: homeRoute
      })
    }

    routes.push({
      path: '/',
      async: homeRoute
    })



    // routes.push({
    //   path: '/landing',
    //   async async(routeTo, routeFrom, resolve, reject) {
    //     self.resolveController(resolve, Global.walletController.showLanding())
    //   }
    // })


    routes.push({
      path: '/createWallet',
      async async(routeTo, routeFrom, resolve, reject) {
        self.resolveController(resolve, Global.walletController.showCreateWallet())
      }
    })

    routes.push({
      path: '/enterRecovery',
      async async(routeTo, routeFrom, resolve, reject) {
        self.resolveController(resolve, Global.walletController.showEnterRecovery())
      }
    })






    routes.push({
      path: '/settings',
      async async(routeTo, routeFrom, resolve, reject) {
        self.resolveController(resolve, Global.settingsController.showSettingsForm())
      }
    })


    routes.push({
      path: '/profile/static/:id',
      async async(routeTo, routeFrom, resolve, reject) {
        self.initAndResolve(resolve, function () {
          return Global.profileController.showStaticProfile(routeTo.params.id)
        })

      }
    })

    routes.push({
      path: '/profile/edit',
      async async(routeTo, routeFrom, resolve, reject) {
        self.initAndResolve(resolve, function () {
          return Global.profileController.showProfileEdit()
        })
      }
    })


    routes.push({
      path: '/post/show/:id',
      async async(routeTo, routeFrom, resolve, reject) {
        self.initAndResolve(resolve, function () {
          return Global.postController.showPost(routeTo.params.id)
        })

      }
    })


    routes.push({
      path: '/connect',
      async async(routeTo, routeFrom, resolve, reject) {
        self.initAndResolve(resolve, function () {
          return Global.connectController.showHome()
        })
      }
    })

    routes.push({
      path: '/following',
      async async(routeTo, routeFrom, resolve, reject) {
        self.initAndResolve(resolve, function () {
          return Global.followController.showFollowing()
        })
      }
    })

    // routes.push({
    //   path: '/logout',
    //   async async(routeTo, routeFrom, resolve, reject) {
    //     Global.walletService.logout()
    //     Global.navigate("/")
    //   }
    // })



    //Needs to be last
    routes.push({
      path: '(.*)',
      // url: 'pages/404.html',
      async async(routeTo, routeFrom, resolve, reject) {
        console.log(routeTo)
      }
    })




    return routes
  }


  async configureWeb3() {

    if (!window['ethereum']) return

    // Request account access
    await window['ethereum'].enable()

    //@ts-ignore
    window.web3Provider = window.ethereum

    //@ts-ignore
    web3 = new Web3(window.web3Provider)

    //@ts-ignore
    const accounts = await promisify(cb => web3.eth.getAccounts(cb))

    let account = accounts[0]
    window['currentAccount'] = account


  }




  async initialize() {

    if (Global.ipfs) return
    if (!Global.wallet) return

    console.log(`Initializing with wallet ${Global.wallet.address}`)

    let settings: Settings = this.settingsService.getSettings()
    if (!settings) {
      throw 'No settings found'
    }

    Template7.global = {
      settings: settings,
    }


    if (Global.isElectron) {
      //electron
      await this.configureElectron()
    } else {
      //browser
      await this.configureBrowser()
    }





    //Ropsten
    Whitepages.networks["3"] = {
      "events": {},
      "links": {},
      "address": settings.whitepagesContractAddress,
      "transactionHash": settings.whitepagesContractTxHash
    }

    //Mainnet
    Whitepages.networks["1"] = {
      "events": {},
      "links": {},
      "address": "0x363d26d0c8E47C10Bec3502078170b392BCF17D5",
      "transactionHash": "0x857070e75551860ec22c9643e41a6bf2713da0b3e30635a491b89e7767a21ddf"
    }

    //@ts-ignore

    //hard coding to mainnet for now
    let contract = new ethers.Contract("0x363d26d0c8E47C10Bec3502078170b392BCF17D5", Whitepages.abi, Global.provider);





    /**
     * Orbit
     */

    let keystore = Keystore.create()

    let identity = await this.identityService.getIdentity(keystore)

    OrbitDB.addDatabaseType(TableStore.type, TableStore)

    Global.orbitDb = await OrbitDB.createInstance(Global.ipfs, {
      identity: identity
    })

    Global.orbitAccessControl = this.identityService.getAccessController(Global.orbitDb)



    //Look up main address
    let mainStore
    try {
      mainStore = await this.schemaService.getMainStoreByWalletAddress(window['currentAccount'])
    } catch (ex) {
      console.log(ex)
    }



    //If it doesn't exist create it
    if (!mainStore) {
      mainStore = await this.schemaService.generateMainStore(Global.orbitDb, Global.orbitAccessControl, window['currentAccount'])
    }



    //Detect whether or not we already have a schema
    let schema: Schema = await this.schemaService.getSchema(mainStore, window['currentAccount'])

    if (!schema) {
      await this.schemaService.generateSchema(Global.orbitDb, Global.orbitAccessControl, mainStore, window['currentAccount'])
      schema = await this.schemaService.getSchema(mainStore, window['currentAccount'])
    }



    //Open profile store
    Global.mainStore = mainStore

    //Update the schema if it needs it.
    await this.schemaService.updateSchema(mainStore, schema, window['currentAccount'])


    Global.imageService = new ImageService()
    Global.profileService = new ProfileService()
    Global.postService = new PublicPostService(this.schemaService)
    Global.postUiService = new PostUIService(Global.postService, Global.profileService, this.schemaService, Global.imageService)
    Global.friendService = new FriendService(Global.postService)
    // Global.processFeedService = new ProcessFeedService(Global.postService, Global.friendService)


    Global.uploadService = new UploadService()
    Global.quillService = new QuillService(Global.uploadService)
    Global.whitepagesService = new WhitepagesService(contract)
    Global.listingService = new ListingService(Global.schemaService, Global.whitepagesService, Global.friendService, Global.profileService)

    Global.homeController = new HomeController(Global.quillService, Global.postUiService, Global.profileService, Global.imageService)
    Global.profileController = new ProfileController(Global.uploadService, Global.profileService, Global.postUiService, Global.imageService)
    Global.settingsController = new SettingsController(Global.settingsService, Global.schemaService)
    Global.postController = new PostController(Global.quillService, Global.postUiService, Global.profileService, Global.imageService)
    Global.connectController = new ConnectController(Global.whitepagesService, Global.queueService, Global.listingService, Global.friendService, Global.profileService, Global.imageService)
    Global.followController = new FollowController(Global.friendService, Global.profileService)

    window['homeController'] = Global.homeController
    window['profileController'] = Global.profileController
    window['postController'] = Global.postController
    window['connectController'] = Global.connectController
    window['followController'] = Global.followController


    console.log("Initialization complete")

  }


  private async configureElectron() {

    //@ts-ignore
    Global.ipfsHost = remote.getGlobal('ipfsHost')

    Global.ipfs = await IPFS.create({
      EXPERIMENTAL: {
        pubsub: true
      },
      relay: {
        enabled: true,
        hop: {
          enabled: true // enable circuit relay HOP (make this node a relay)
        }
      },
      config: {
        Addresses: {
          //@ts-ignore
          Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star', Global.ipfsHost]
        }
      }
    })

  }

  private async configureBrowser() {

    Global.ipfs = await IPFS.create({
      EXPERIMENTAL: {
        pubsub: true
      },
      relay: {
        enabled: true,
        hop: {
          enabled: true // enable circuit relay HOP (make this node a relay)
        }
      },
      config: {
        Addresses: {
          //@ts-ignore
          Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star', '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmcMJ3VrvhTN1AESDEq4A45GeKiK69mBbSN4KKzjynbgTF']
        }
      }
    });

    await this.configureWeb3();

  }

  async initAndResolve(resolve, successFunction) {
    try {
      await this.initialize()
      this.resolveController(resolve, successFunction())
    } catch (ex) {
      console.log(ex)
      Global.showExceptionPopup(ex)
      // Global.navigate("/settings")
    }
  }


  //Handles routing to a controller
  async resolveController(resolve, controller_promise: Promise<ModelView>) {

    try {

      let modelView: ModelView = await controller_promise;

      if (!modelView) return

      resolve({
        componentUrl: modelView.view
      },
        {
          context: { fn: modelView.model }
        })

    } catch (ex) {
      Global.showExceptionPopup(ex)
      console.log(ex)
    }

  }



}

export { RouteService }
