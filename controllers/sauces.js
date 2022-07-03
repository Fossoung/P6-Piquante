
const Sauce = require("../models/Sauce_model");
const fs = require("fs");
const { error } = require("console");

// LOGIQUE GET ALL SAUCE
// accède à toutes les sauces
exports.getAllSauce = (req, res, next) => {
  // on veut la liste complète de Sauce alors on utilise find() sans argument
  Sauce.find()
    //  status 200 OK 
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    // erreur un status 400 Bad Request 
    .catch((error) => res.status(400).json({ error }));
};

// LOGIQUE GET ONE SAUCE
// une personne avec un webtokenvalide accède à ces informations puisque seulement le token identifie et donne accés
exports.getOneSauce = (req, res, next) => {
  // on utilise le modele mangoose et findOne pour trouver un objet via la comparaison req.params.id
  Sauce.findOne({ _id: req.params.id })
    // status 200 OK 
    .then((sauce) => res.status(200).json(sauce))
    // si erreur envoit un status 404 
    .catch((error) => res.status(404).json({ error }));
};
//----------------------------------------------------------------------------------
// LOGIQUE CREATE SAUCE
//----------------------------------------------------------------------------------
// créait une sauce
exports.createSauce = (req, res, next) => {
  // on extrait le sauce de la requete via le parse
  // dans req.body.sauce le sauce correspont à la key de postman pour ajouter les infos en texte
  const sauceObject = JSON.parse(req.body.sauce);
  // constant qui servira à initialiser certains paramètres à la création
  const initialisation = {
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  };
  
  if (sauceObject.userId !== req.auth.userId) {
    // reponse en status 403 Forbidden 
    return res.status(403).json("unauthorized request");
    // détermine si le fichier envoyé est bien une image 
  } else if (
    req.file.mimetype === "image/jpeg" ||
    req.file.mimetype === "image/png" ||
    req.file.mimetype === "image/jpg" ||
    req.file.mimetype === "image/bmp" ||
    req.file.mimetype === "image/gif" ||
    req.file.mimetype === "image/ico" ||
    req.file.mimetype === "image/svg" ||
    req.file.mimetype === "image/tiff" ||
    req.file.mimetype === "image/tif" ||
    req.file.mimetype === "image/webp"
  ) {
    // déclaration de sauce qui sera une nouvelle instance du modele Sauce qui contient toutes les informations dont on a besoin
    const sauce = new Sauce({
      // raccourci spread pour récupérer toutes les données de req.body ( title description...)
      ...sauceObject,
      // l'image url correspont au protocole avec :// puis la valeur du port (host) dans le dossier images qui a le nom
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
      ...initialisation,
    });
    // si problème avec valeur heat (postman) initialisation de sa valeur
    if (sauce.heat < 0 || sauce.heat > 10) {
      sauce.heat = 0;
      console.log("valeur heat invalide, heat initialisé");
    }
    // enregistre l'objet dans la base de donnée
    sauce
      .save()
      .then(() =>
        res
          .status(201)
          .json({ message: "POST recorded sauce (FR)sauce enregistrée !" })
      )
      // en cas d'erreur on renvoit un status 400 Bad Request et l'erreur
      .catch((error) => res.status(400).json({ error }));
    // si ce qui est envoyé n'est pas un fichier image
  } else {
    const sauce = new Sauce({
      // raccourci spread pour récupérer toutes les données de req.body ( title description...)
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get(
        "host"
      )}/images/defaut/imagedefaut.png`,
      ...initialisation,
    });
    if (sauce.heat < 0 || sauce.heat > 10) {
      sauce.heat = 0;
      console.log("valeur heat invalide, heat initialisé");
    }
    // enregistre l'objet dans la base de donnée
    sauce
      .save()
      // retourne une promesse un status 201 OK pour bonne création de ressource + message
      .then(() =>
        res
          .status(201)
          .json({ message: "POST recorded sauce (FR)sauce enregistrée !" })
      )
      // en cas d'erreur on renvoit un status 400 Bad Request et l'erreur
      .catch((error) => res.status(400).json({ error }));
  }
};
//----------------------------------------------------------------------------------
// LOGIQUE MODIFY SAUCE
//----------------------------------------------------------------------------------
// modifie une sauce
exports.modifySauce = (req, res, next) => {
  // l'id de la sauce est l'id inscrit dans l'url
  Sauce.findOne({ _id: req.params.id })
    // si la sauce existe
    .then((sauce) => {
      // cette variable permettra de traverser le scope pour réduire le code
      var sauceBot;
      //constante de valeur heat de la sauce avant modification, servira si le nouveau heat a une valeur inacceptable (via postman)
      const heatAvant = sauce.heat;
      //l'user sera celui validé par le token, on ne pourra pas modifier l'appartenance de la sauce
      //like et tableau ne pourront pas être modifiés dans postman
      const immuable = {
        userId: req.auth.userId,
        likes: sauce.likes,
        dislikes: sauce.dislikes,
        usersLiked: sauce.usersLiked,
        usersDisliked: sauce.usersDisliked,
      };
      // l'id du créateur de la sauce doit etre le meme que celui identifié par le token
      if (sauce.userId !== req.auth.userId) {
        // reponse en status 403 Forbidden avec message json
        return res.status(403).json("unauthorized request");
        // si il y a un fichier avec la demande de modification
      } else if (req.file) {
        // on vérifie que c'est bien une image 
        if (
          req.file.mimetype === "image/jpeg" ||
          req.file.mimetype === "image/png" ||
          req.file.mimetype === "image/jpg" ||
          req.file.mimetype === "image/bmp" ||
          req.file.mimetype === "image/gif" ||
          req.file.mimetype === "image/ico" ||
          req.file.mimetype === "image/svg" ||
          req.file.mimetype === "image/tiff" ||
          req.file.mimetype === "image/tif" ||
          req.file.mimetype === "image/webp"
        ) {
          // on détermine le nom de l'ancien fichier image
          const filename = sauce.imageUrl.split("/images/")[1];
          // si ceci correspond à une partie du nom de l'image par defaut
          const testImage = 'defaut/imagedefaut.png';
          // si le nom de l'image ne correspont pas à l'image defaut
          if(testImage != filename){
          // on efface le fichier image qui doit se faire remplacer
          fs.unlink(`images/${filename}`, () => {});
          }
          // on extrait le sauce de la requete via le parse
          // dans req.body.sauce le sauce correspont à la key de postman pour ajouter les infos en texte
          const sauceObject = {
            ...JSON.parse(req.body.sauce),
            // on ajoute l'image avec ce nom
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
              req.file.filename
            }`,
            ...immuable,
          };
          sauceBot = sauceObject;
          // si le fichier n'est pas une image
        } else {
          // on détermine le nom de l'ancien fichier image
          const filename = sauce.imageUrl.split("/images/")[1];
          // si ceci correspond à une partie du nom de l'image par defaut
          const testImage = 'defaut/imagedefaut.png';
          // si le nom de l'image ne correspont pas à l'image defaut
          if(testImage != filename){
          // on efface le fichier image qui doit se faire remplacer
          fs.unlink(`images/${filename}`, () => {});
          }
          // on récupère avec le parse req.body.sauce et on y ajoute la nouvelle image
          // dans req.body.sauce le sauce correspont à la key de postman pour ajouter les infos en texte
          const sauceObject = {
            ...JSON.parse(req.body.sauce),
            // l'image sera l'image par defaut
            imageUrl: `${req.protocol}://${req.get(
              "host"
            )}/images/defaut/imagedefaut.png`,
            ...immuable,
          };
          sauceBot = sauceObject;
        }
        // si il n'y a pas de fichier avec la modification (ps: il garde son image injectée à la création)
      } else {
        // puisqu'il n'y a pas de fichier image, l'imageUrl de la requete sera par defaut l'ancienne imageUrl même si on modifie l'entrée avec postman
        req.body.imageUrl = sauce.imageUrl;
        // la sauce sera la requete
        const sauceObject = {
          ...req.body,
          ...immuable,
        };
        sauceBot = sauceObject;
      }
      // si problème avec valeur heat (postman) sa valeur restera celle avant la requête
      if (sauceBot.heat < 0 || sauceBot.heat > 10) {
        sauceBot.heat = heatAvant;
        console.log("valeur heat invalide, ancienne valeur heat conservée");
      }
      // modifie un sauce dans la base de donnée, 1er argument c'est l'objet qu'on modifie avec id correspondant à l'id de la requete
      // et le deuxième argument c'est la nouvelle version de l'objet qui contient le sauce qui est dans le corp de la requete et que _id correspond à celui des paramètres
      Sauce.updateOne(
        { _id: req.params.id },
        { ...sauceBot, _id: req.params.id }
      )
        // retourne une promesse avec status 201 Created et message en json
        .then(() =>
          res
            .status(201)
            .json({ message: "modified sauce (FR)Objet modifié !" })
        )
        // en cas d'erreur un status 400 Bad Request et l'erreur en json
        .catch((error) => res.status(400).json({ error }));
    })
    // en cas d'erreur
    .catch((error) => {
      // si il y a un fichier avec la requete
      if (req.file) {
        // le fichier de la requete a été créé avec multer donc on l'éfface
        fs.unlink(`images/${req.file.filename}`, () => {});
      }
      // erreur 404 Not Found indique l'erreur en json
      res.status(404).json({ error });
    });
};
//----------------------------------------------------------------------------------
// LOGIQUE DELETE SAUCE
//----------------------------------------------------------------------------------
// efface une sauce
exports.deleteSauce = (req, res, next) => {
  // trouve dans les sauce un _id correspondant à l'id de la requete
  Sauce.findOne({ _id: req.params.id })
    // si il trouve sauce
    .then((sauce) => {
      //variable du nom de l'image de la sauce trouvée
      const nomImage = sauce.imageUrl;
      // variable de l'image sauce par défaut
      const imDefaut = "http://localhost:3000/images/defaut/imagedefaut.png";
      // l'id du créateur de la sauce doit etre le meme que celui identifié par le token sinon
      if (sauce.userId !== req.auth.userId) {
        // reponse en status 403 Forbidden avec message json
        return res.status(403).json("unauthorized request");
        // et si nom de l'image sauce est différante de celle par defaut
      } else if (nomImage != imDefaut) {
        // on créait un tableau via l'url et en séparant la partie '/images' et ensuite on recupère l'indice 1 du tableau qui est le nom du fichier
        const filename = sauce.imageUrl.split("/images/")[1];
        // unlink va supprimer le fichier image de la sauce concernée dans le dossier image
        fs.unlink(`images/${filename}`, () => {
          // effacera un sauce et son _id sera la comparaison avec l'id des paramètres de la requete (paramètre de route)
          Sauce.deleteOne({ _id: req.params.id })
            // retourne une promesse status 200 OK et message en json
            .then(() =>
              res
                .status(200)
                .json({ message: "sauce removed (FR)sauce supprimée !" })
            )
            // si erreur status 400 400 Bad Request et erreur en json
            .catch((error) => res.status(400).json({ error }));
        });
        // alors le nom de l'image sauce est celui de celle par defaut
      } else {
        // effacera un sauce et son _id sera la comparaison avec l'id des paramètres de la requete (paramètre de route)
        Sauce.deleteOne({ _id: req.params.id })
          // retourne une promesse status 200 OK et message en json
          .then(() =>
            res
              .status(200)
              .json({ message: "sauce removed (FR)sauce supprimée !" })
          )
          
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(404).json({ error }));
};
//----------------------------------------------------------------------------------
// LOGIQUE LIKE SAUCE
//----------------------------------------------------------------------------------
// like une sauce
exports.likeSauce = (req, res, next) => {
  // on utilise le modele mangoose et findOne pour trouver un objet via la comparaison req.params.id
  Sauce.findOne({ _id: req.params.id })
    //retourne une promesse avec reponse status 200 OK et l'élément en json
    .then((sauce) => {
      // définition de diverse variables
      let valeurVote;
      let votant = req.body.userId;
      let like = sauce.usersLiked;
      let unlike = sauce.usersDisliked;
      // determine si l'utilisateur est dans un tableau
      let bon = like.includes(votant);
      let mauvais = unlike.includes(votant);
      // ce comparateur va attribuer une valeur de point en fonction du tableau dans lequel il est
      if (bon === true) {
        valeurVote = 1;
      } else if (mauvais === true) {
        valeurVote = -1;
      } else {
        valeurVote = 0;
      }
      if (valeurVote === 0 && req.body.like === 1) {
        // ajoute 1 vote positif à likes
        sauce.likes += 1;
        // le tableau usersLiked contiendra l'id de l'user
        sauce.usersLiked.push(votant);
        // si l'user a voté positivement et veut annuler son vote
      } else if (valeurVote === 1 && req.body.like === 0) {
        // enlève 1 vote positif
        sauce.likes -= 1;
        // filtre/enlève l'id du votant du tableau usersLiked
        const nouveauUsersLiked = like.filter((f) => f != votant);
        // on actualise le tableau
        sauce.usersLiked = nouveauUsersLiked;
        // si l'user a voté négativement et veut annuler son vote
      } else if (valeurVote === -1 && req.body.like === 0) {
        // enlève un vote négatif
        sauce.dislikes -= 1;
        // filtre/enlève l'id du votant du tableau usersDisliked
        const nouveauUsersDisliked = unlike.filter((f) => f != votant);
        // on actualise le tableau
        sauce.usersDisliked = nouveauUsersDisliked;
        // si l'user n'a pas voté avant et vote négativement
      } else if (valeurVote === 0 && req.body.like === -1) {
        // ajoute 1 vote positif à unlikes
        sauce.dislikes += 1;
        // le tableau usersDisliked contiendra l'id de l'user
        sauce.usersDisliked.push(votant);
        // pour tout autre vote, il ne vient pas de l'index/front donc probabilité de tentative de vote illégal
      } else {
        console.log("tentavive de vote illégal");
      }
      Sauce.updateOne(
        { _id: req.params.id },
        {
          likes: sauce.likes,
          dislikes: sauce.dislikes,
          usersLiked: sauce.usersLiked,
          usersDisliked: sauce.usersDisliked,
        }
      )
        
        .then(() => res.status(201).json({ message: "Vous venez de voter" }))
        .catch((error) => {
          if (error) {
            console.log(error);
          }
        });
    })
    // si erreur envoit un status 404 Not Found et l'erreur en json
    .catch((error) => res.status(404).json({ error }));
};
