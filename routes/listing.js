const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Route for search functionality
router.get("/search", async (req, res) => {
  const raw = req.query.q || "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return res.redirect("/listings");
  }

  const query = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
  try {
    const listings = await Listing.find({
      title: { $regex: query, $options: "i" },
    });

    res.locals.showSearch = true;
    res.render("listings/searchResults", { listings, query });
  } catch (err) {
    console.error("Search error:", err);
    req.flash("error", "Something went wrong with the search.");
    res.redirect("/listings");
  }
});

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

module.exports = router;
