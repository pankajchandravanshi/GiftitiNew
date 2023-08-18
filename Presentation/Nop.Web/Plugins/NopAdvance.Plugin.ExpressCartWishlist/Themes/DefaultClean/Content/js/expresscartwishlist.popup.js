var ExpressCartWishlist = {
  loadWaiting: false,
  usepopupnotifications: false,
  popupSelector: false,
  popupBodySelector: false,
  productData: {},
  formselector: '',
  fromProductBox: false,
  urlGetCart:"",

  init: function (usepopupnotifications, popupSelector, popupBodySelector) {
    this.loadWaiting = false;
    this.usepopupnotifications = usepopupnotifications;
    this.popupSelector = popupSelector;
    this.popupBodySelector = popupBodySelector;
    this.productData = {};
  },

  setLoadWaiting: function (display) {
    displayAjaxLoading(display);
    this.loadWaiting = display;
  },

  //add a product to the cart/wishlist from the catalog pages
  addproducttocart_catalog: function (urladd, urlGetCart, postData) {
    if (this.loadWaiting !== false) {
      return;
    }
    this.productData = postData;
    this.urlGetCart = urlGetCart;
    this.fromProductBox = false;
    this.setLoadWaiting(true);
    addAntiForgeryToken(postData);

    $.ajax({
      cache: false,
      url: urladd,
      type: "POST",
      data: postData,
      success: this.success_process,
      complete: this.resetLoadWaiting,
      error: this.ajaxFailure
    });
  },

  //add a product to the cart/wishlist from the product details page
  addproducttocart_details: function (urladd, urlGetCart) {
    if (this.loadWaiting !== false) {
      return;
    }
    this.fromProductBox = true;
    this.urlGetCart = urlGetCart;
    this.setLoadWaiting(true);
    $.ajax({
      cache: false,
      url: urladd,
      data: $(this.formselector).serialize(),
      type: "POST",
      success: this.success_process,
      complete: this.resetLoadWaiting,
      error: this.ajaxFailure
    });
  },

  success_process: function (response) {
    if (response.updatetopcartsectionhtml) {
      $(AjaxCart.topcartselector).html(response.updatetopcartsectionhtml);
    }
    if (response.updatetopwishlistsectionhtml) {
      $(AjaxCart.topwishlistselector).html(response.updatetopwishlistsectionhtml);
    }
    if (response.updateflyoutcartsectionhtml) {
      $(AjaxCart.flyoutcartselector).replaceWith(response.updateflyoutcartsectionhtml);
    }
    if (response.message) {
      //display notification
      if (response.success === true) {
        //success
        var quantity = 1;
        if (ExpressCartWishlist.fromProductBox) {
          var jsonData = ExpressCartWishlist.convertFormToJSON(ExpressCartWishlist.formselector);
          quantity = jsonData.EnteredQuantity;
        }

        //Get shopping cart item information
        $.ajax({
          cache: false,
          url: ExpressCartWishlist.urlGetCart + "&quantity=" + quantity,
          type: "GET",
          success: function (res) {
            //Append data in popup body
            $(ExpressCartWishlist.popupBodySelector).html(res);

            //Open popup with data.
            $(ExpressCartWishlist.popupSelector).click();
          },
          complete: this.resetLoadWaiting,
          error: this.ajaxFailure
        });

      }
      else {
        //error
        if (ExpressCartWishlist.usepopupnotifications === true) {
          displayPopupNotification(response.message, 'error', true);
        }
        else {
          //no timeout for errors
          displayBarNotification(response.message, 'error', 0);
        }
      }
      return false;
    }
    if (response.redirect) {
      location.href = response.redirect;
      return true;
    }
    return false;
  },

  convertFormToJSON: function (form) {
    return $(form)
      .serializeArray()
      .reduce(function (json, { name, value }) {
        if (name.indexOf('.') > -1)
          json[name.split('.')[1]] = value;
        else
          json[name] = value;
        return json;
      }, {});
  },

  resetLoadWaiting: function () {
    ExpressCartWishlist.setLoadWaiting(false);
  },

  ajaxFailure: function () {
    alert();
  }
};