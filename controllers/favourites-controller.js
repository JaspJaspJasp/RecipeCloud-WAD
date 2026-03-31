const Favourite = require('../models/favourite-model');

exports.getFavourite = async (req, res) => {
    const favourites = await Favourite.find({ userId: req.user._id });
    res.render('favourites/index', { favourites });
};

exports.addFavourite = async (req, res) => {
    const { recipeId, recipeName, tags, notes } = req.body;
    await Favourite.create({
        userId: req.user._id,
        recipeId,
        recipeName,
        tags: tags ? tags.split(',') : [], 
        notes
    });
    res.redirect('/favourites');
};

exports.updateFavourite = async (req, res) => {
    const { notes, tags } = req.body;
    await Favourite.findByIdAndUpdate(req.params.id, {
        notes,
        tags: tags ? tags.split(',') : []
    });
    res.redirect('/favourites');
};

exports.deleteFavourite = async (req, res) => {
    await Favourite.findByIdAndDelete(req.params.id);
    res.redirect('/favourites');
};