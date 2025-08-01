/* eslint-disable */
(function () {
    /* eslint-disable */
    if (!window.$mcSite) {
        $mcSite = {
            optinFeatures: [],

            loadingPrerequisites: [],
            permissionProviders: {},

            registerPermissionProvider: function (permission, permissionResolutionPromise) {
                window.$mcSite.permissionProviders[permission] = permissionResolutionPromise;
            },

            enableOptIn: function () {
                this.createCookie("mc_user_optin", true, 365);
                this.optinFeatures.forEach(function (fn) {
                    fn();
                });
            },

            runIfOptedIn: function (fn, additionalPermissions) {
                Promise.all(this.loadingPrerequisites).then(function () {
                    this._runIfOptedIn.call(this, fn, additionalPermissions);
                }.bind(this));
            },

            _runIfOptedIn: function (fn, additionalPermissions) {
                if (!additionalPermissions || additionalPermissions.length === 0) {
                    if (this.hasOptedIn()) {
                        fn();
                    } else {
                        this.optinFeatures.push(fn);
                    }
                } else {
                    var wrappedPermmissionsFn = function () {
                        if (additionalPermissions.length === 0) {
                            fn();
                        }

                        // Get available permission providers
                        var permissionProviders = additionalPermissions.reduce(function (providers, permission) {
                            if (window.$mcSite.permissionProviders[permission]) {
                                providers.push(window.$mcSite.permissionProviders[permission]);
                            }
                            return providers;
                        }, []);

                        // Check if all permissions are granted
                        Promise.all(permissionProviders).then(function (results) {
                            var allPermissionsGranted = results.every(function (result) {
                                return result === true;
                            });

                            if (allPermissionsGranted) {
                                fn();
                            }
                        });
                    }

                    if (this.hasOptedIn()) {
                        wrappedPermmissionsFn();
                    } else {
                        this.optinFeatures.push(wrappedPermmissionsFn);
                    }
                }
            },

            hasOptedIn: function () {
                var cookieValue = this.readCookie("mc_user_optin");

                if (cookieValue === undefined) {
                    return true;
                }

                return cookieValue === "true";
            },

            createCookie: function (name, value, expirationDays) {
                var cookie_value = encodeURIComponent(value) + ";";

                if (expirationDays === undefined) {
                    throw new Error("expirationDays is not defined");
                }

                // set expiration
                if (expirationDays !== null) {
                    var expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + expirationDays);
                    cookie_value += " expires=" + expirationDate.toUTCString() + ";";
                }

                cookie_value += "path=/";
                document.cookie = name + "=" + cookie_value;
            },

            readCookie: function (name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(";");

                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];

                    while (c.charAt(0) === " ") {
                        c = c.substring(1, c.length);
                    }

                    if (c.indexOf(nameEQ) === 0) {
                        return c.substring(nameEQ.length, c.length);
                    }
                }

                return undefined;
            }
        };
    }

    /* eslint-disable */
(function () {
    var availablePermissionResolvers = {
        'preferencesProcessingAllowed': function () {
            return new Promise(function (resolve) {
                try {
                    var result = window.Shopify.customerPrivacy.preferencesProcessingAllowed();
                    if (!result) {
                        throw new Error('Preferences processing not allowed');
                    }

                    resolve(result);
                } catch (e) {
                    document.addEventListener('visitorConsentCollected', function (event) {
                        if (event.detail && event.detail.preferencesAllowed) {
                            resolve(event.detail.preferencesAllowed);
                        }
                    });
                }
            })
        },

        'analyticsProcessingAllowed': function () {
            return new Promise(function (resolve) {
                try {
                    var result = window.Shopify.customerPrivacy.analyticsProcessingAllowed();

                    if (!result) {
                        throw new Error('Preferences processing not allowed');
                    }

                    resolve(result);
                } catch (e) {
                    document.addEventListener('visitorConsentCollected', function (event) {
                        if (event.detail && event.detail.analyticsAllowed) {
                            resolve(event.detail.analyticsAllowed);
                        }
                    });
                }

            })
        },
        'marketingAllowed': function () {
            return new Promise(function (resolve) {
                try {
                    var result = window.Shopify.customerPrivacy.marketingAllowed();

                    if (!result) {
                        throw new Error('Preferences processing not allowed');
                    }

                    resolve(result);
                } catch (e) {
                    document.addEventListener('visitorConsentCollected', function (event) {
                        if (event.detail && event.detail.marketingAllowed) {
                            resolve(event.detail.marketingAllowed);
                        }
                    });
                }
            })
        }
    };

    /* eslint-disable */
    if (window.$mcSite) {
        if (window.Shopify) {
            window.$mcSite.loadingPrerequisites.push(new Promise(function (resolve) {
                try {
                    window.Shopify.loadFeatures([
                        {
                            name: 'consent-tracking-api',
                            version: '0.1',
                        },
                    ],
                        function () {
                            if (window.Shopify.customerPrivacy) {

                                // Register the permission providers
                                var availablePermissions = Object.keys(availablePermissionResolvers);
                                for (var i = 0; i < availablePermissions.length; i++) {
                                    var permission = availablePermissions[i];

                                    window.$mcSite.registerPermissionProvider(permission, availablePermissionResolvers[permission]());
                                }
                            }
                            resolve();
                        }
                    );
                } catch (e) {
                    resolve();
                }
            }));
        }
    }
})();


    $mcSite.shopify_attribution_cookie={settings:{}};$mcSite.adwords_remarketing={settings:{google_conversion_id:"10932958614",google_remarketing_only:"1",enabled:"1"}};$mcSite.attribution={settings:{url:"\/\/videogamesplus.us15.list-manage.com\/track\/engagement",uid:"4896fa27dc21d6a8d12cb6bf0"}};
})();
/**
 * This file contains code that will maintain an MC cookie on a Shopify store's site.
 * The cookie stores data from our tracking params (utm_*, mc_* params) to then be
 * attributed to an order during the Shopify checkout process and allow us to have
 * more flexibility in conversion attribution for our outreaches (campaigns, ads, etc).
 */
(function () {
    /**
     * A namespace for MC for Shopify's conversion attribution.
     * @namespace
     */
    var conversion = {
        /**
         * Looks for MC tracking params, validates their values, then stores them in a cookie.
         */
        processParameters: function () {
            var utmCampaignParam = this.getParameter("utm_campaign");
            var utmSourceParam = this.getParameter("utm_source");
            var utmMediumParam = this.getParameter("utm_medium");
            var gclid = this.getParameter("gclid");
            var mccid = this.getParameter("mc_cid");

            if (this.isValidUTMCampaign(utmCampaignParam) &&
                this.isValidUTMSource(utmSourceParam) &&
                this.isValidUTMMedium(utmMediumParam)
            ) {
                this.storeEngagement(utmCampaignParam, utmSourceParam, utmMediumParam, gclid, /* expiration, in days */ 365);
            } else if (this.isValidMCCID(mccid)) {
                this.storeMCCIDEngagement(mccid, 365);
            }
        },
        /**
         * Convert our saved engagement data to Shopify cart attributes
         * @param {Object}  engagement Engagement object from our cookie.
         * @return {Object} Engagement object to be sent to Shopify's cart attribute input fields.
         */
        engagementToAttribs: function (engagement) {
            return {
                "utm_campaign": engagement.id,
                "utm_source": engagement.src,
                "utm_medium": engagement.medium,
                "created_at": engagement.created_at,
                "gclid": engagement.gclid,
                "mc_cid": engagement.mccid
            };
        },
        /**
         * Handles injecting cart attribute input fields into the Shopify Cart form.
         * @param {Element} cartForm   Shopify Cart form's Document Element.
         * @param {Object}  engagement Engagement object from our cookie.
         */
        injectCartAttributes: function (cartForm, engagement) {
            var attribs = this.engagementToAttribs(engagement);
            var p = this.createAttributeParagraphElement();
            for (var attribName in attribs) {
                if (attribs.hasOwnProperty(attribName)) {
                    var input = this.createAttributeInputField(attribName, attribs[attribName]);
                    p.appendChild(input);
                }
            }
            cartForm.appendChild(p);
        },
        /**
         * Checks if "Do Not Track" is enabled.
         * @return {Boolean} Whether the browser has "Do Not Track" enabled.
         */
        isDoNotTrack: function () {
            if (navigator.doNotTrack === "1") {
                return true;
            }

            if (navigator.msDoNotTrack === "1") {
                return true;
            }

            return false;
        },
        /**
         * Gets the current unix timestamp.
         * @return {Number} The timestamp in seconds.
         */
        getUnixTimestamp: function () {
            return Math.round((new Date()).getTime() / 1000);
        },
        /**
         * Gets the value of a query parameter.
         * @param {String} name     The param name.
         * @return {String|null}    The param value.
         */
        getParameter: function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
            var results = regex.exec(location.search);

            return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
        },
        /**
         * Checks if the "utm_campaign" value is valid.
         * @param {String} utmCampaignParam The param value.
         * @return {Boolean}                Whether the value is valid.
         */
        isValidUTMCampaign: function (utmCampaignParam) {
            if (!utmCampaignParam) {
                return false;
            }

            var regex = new RegExp("^[a-zA-Z0-9]{10,12}$"); // unique_id for campaigns is 10, ads is 12

            return utmCampaignParam.search(regex) === -1 ? false : true;
        },
        /**
         * Checks if the "utm_source" value is valid.
         * @param {String} utmSourceParam   The param value.
         * @return {Boolean}                Whether the value is valid.
         */
        isValidUTMSource: function (utmSourceParam) {
            if (!utmSourceParam) {
                return false;
            }

            var regex = new RegExp("^mailchimp$", "i");

            return utmSourceParam.search(regex) === -1 ? false : true;
        },
        /**
         * Checks if the "utm_medium" value is valid.
         * @param {String} utmMediumParam   The param value.
         * @return {Boolean}                Whether the value is valid.
         */
        isValidUTMMedium: function (utmMediumParam) {
            if (!utmMediumParam) {
                return false;
            }

            var regex = new RegExp("^(campaign|ad)$", "i");

            return utmMediumParam.search(regex) === -1 ? false : true;
        },
        /**
         * Checks if the "mc_cid" value is valid.
         * @param {String} mccid            The param value.
         * @return {Boolean}                Whether the value is valid.
         */
        isValidMCCID: function (mccid) {
            if (!mccid) {
                return false;
            }

            var regex = new RegExp("^[a-zA-Z0-9]{10,12}$"); // unique_id for campaigns is 10, ads is 12

            return mccid.search(regex) === -1 ? false : true;
        },
        /**
         * Gets engagement objects from the stored cookie.
         * @return {Object[]} An array of engagement objects.
         */
        getEngagements: function () {
            var cookie = this.readCookie("mc_track");
            var engagements = JSON.parse(decodeURIComponent(cookie));

            return engagements !== null ? engagements : [];
        },
        /**
         * Gets engagement objects from the stored cookie, sorted by creation time.
         * @return {Object[]} An array of engagement objects.
         */
        getEngagementsSortedByCreatedAt: function () {
            var engagements = this.getEngagements();
            return engagements.sort(function (a, b) {return b.created_at - a.created_at;});
        },
        /**
         * Gets the most recent engagement object.
         * @return {Object|null} An engagement object.
         */
        getMostRecentEngagement: function () {
            var engagements = this.getEngagementsSortedByCreatedAt();
            return engagements.length > 0 ? engagements[0] : null;
        },
        /**
         * Gets whether an engagement with the provided id is already stored.
         * @param {String} id   Engagment id to be checked.
         * @return {Boolean}    Whether the engagement is already stored.
         */
        hasStoredEngagement: function (id) {
            var engagements = this.getEngagements();
            return engagements.filter(function (obj) {return obj.id === id;}).length === 0 ? false : true;
        },
        /**
         * Returns whether an mc_cid is already stored as an engagement.
         *
         * @param {String} mccid    The mc_cid.
         *
         * @return {boolean}        Whether the engagement is already stored.
         */
        hasStoredMCCIDEngagement: function (mccid) {
            return this.getEngagements().filter(function (obj) {return obj.mccid && obj.mccid === mccid;}).length === 0 ? false : true;
        },
        /**
         * Stores an engagement object in the cookie.
         * @param {String} id           The engagement id / utm_campaign.
         * @param {String} source       The utm_source.
         * @param {String} medium       The utm_medium.
         * @param {String} gclid        The gclid.
         * @param {number} expiration   Number of days before this should expire.
         */
        storeEngagement: function (id, source, medium, gclid, expiration) {
            if (!this.hasStoredEngagement(id)) {
                var engagements = this.getEngagements();

                var engagementObj = this.generateEngagementObject(id, source, medium, gclid, null);
                engagements.push(engagementObj);

                // unix timestamp of ~2 months ago
                var twoMonthsAgo = this.getUnixTimestamp() - 60 * 60 * 24 * 60;

                // remove engagements older than 2 months
                var recentEngagements = engagements.filter(function (obj) {
                    return obj.created_at > twoMonthsAgo;
                });

                this.createCookie("mc_track", JSON.stringify(recentEngagements), expiration);
            }
        },
        /**
         * Stores an mc_cid engagement.
         *
         * @param {String} mccid        The mc_cid.
         * @param {number} expiration   Expiration, in days.
         */
        storeMCCIDEngagement: function (mccid, expiration) {
            if (this.hasStoredMCCIDEngagement(mccid)) {
                return;
            }

            var engagements = this.getEngagements();

            var engagementObj = this.generateEngagementObject(null, null, null, null, mccid);
            engagements.push(engagementObj);

            // unix timestamp of ~2 months ago
            var twoMonthsAgo = this.getUnixTimestamp() - 60 * 60 * 24 * 60;

            // remove engagements older than 2 months
            var recentEngagements = engagements.filter(function (obj) {
                return obj.created_at > twoMonthsAgo;
            });

            this.createCookie("mc_track", JSON.stringify(recentEngagements), expiration);
        },
        /**
         * Generates an engagement object.
         * @param {String} id           The engagement id / utm_campaign value.
         * @param {String} source       The utm_source value.
         * @param {String} medium       The utm_medium value.
         * @param {String} gclid        The gclid value.
         * @param {String} mccid        The mc_cid value.
         * @return {Object}             The generated engagement object.
         */
        generateEngagementObject: function (id, source, medium, gclid, mccid) {
            return {
                "id": id,
                "src": source,
                "medium": medium,
                "gclid": gclid,
                "mccid": mccid,
                "created_at": this.getUnixTimestamp()
            };
        },
        /**
         * Creates a cookie.
         * @param {String} name             The cookie name.
         * @param {String} value            The cookie value.
         * @param {Number} expirationDays   The cookie's expiration time, in days.
         */
        createCookie: function (name, value, expirationDays) {
            var cookie_value = encodeURIComponent(value) + ";";

            // set expiration
            if (expirationDays !== null) {
                var expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + expirationDays);
                cookie_value += " expires=" + expirationDate.toUTCString() + ";";
            }

            // set path
            cookie_value += "path=/";

            document.cookie = name + "=" + cookie_value;
        },
        /**
         * Retrieves a cookie value.
         * @param {String} name     The cookie name.
         * @return {String|null}    The cookie value.
         */
        readCookie: function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(";");

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];

                while (c.charAt(0) === " ") {
                    c = c.substring(1, c.length);
                }

                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }

            return null;
        },
        /**
         * Retrieves the Shopify Cart form from the DOM.
         * @return {Element|null} The Shopify cart form element.
         */
        getCartForm: function () {
            return document.querySelector("form[action='/cart']");
        },
        /**
         * Creates a hidden Input Field element for cart attribute injection.
         * @param {String} name     The "name" value for the input field.
         * @param {String} value    The "value" value for the input field.
         * @return {Element}        The created input field element.
         */
        createAttributeInputField: function (name, value) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = "attributes[" + name + "]";
            input.value = value;

            return input;
        },
        /**
         * Creates a Paragraph element for Shopify's custom cart attributes.
         * @return {Element}        The created paragraph element.
         */
        createAttributeParagraphElement: function () {
            var p = document.createElement("p");
            p.setAttribute("class", "cart-attribute__field");

            return p;
        },
        /**
         * Save the engagement using the Shopify Ajax API. Eats errors.
         * @param {Object} engagement Engagement object from our cookie.
         */
        postCartAttributes: function (engagement) {
            var attribs = this.engagementToAttribs(engagement);
            try {
                var req = new XMLHttpRequest();
                req.open("POST", "/cart/update.js", true);
                req.setRequestHeader("Content-Type", "application/json");
                req.send(JSON.stringify({attributes: attribs}));
            } catch (send_error) {
                console.warn("Unable to set attribution params in Shopify: " + send_error.message);
            }
        },

        updateCustomerSession: function () {
            var customer_session_id = this.readCookie("mc_customer_session_id");
            if (customer_session_id) {

                var data = {
                    attributes: {
                        customer_session_id: customer_session_id
                    }
                };

                try {
                    var req = new XMLHttpRequest();
                    req.open("POST", "/cart/update.js", true);
                    req.setRequestHeader("Content-Type", "application/json");
                    req.send(JSON.stringify(data));
                } catch (send_error) {
                    console.warn("Unable to set attribution params in Shopify: " + send_error.message);
                }
            }
        }
    };

    if (window.$mcSite === undefined || window.$mcSite.shopify_attribution_cookie === undefined) {
        return;
    }

    var module = window.$mcSite.shopify_attribution_cookie;

    if (module.installed === true) {
        return;
    }

    module.installed = true;

    if (conversion.isDoNotTrack()) {
        return;
    }

    conversion.processParameters();

    // wait a sec for the attribution call to be made
    setTimeout(function () {
        conversion.updateCustomerSession();
    }, 3000);

    var engagement = conversion.getMostRecentEngagement();
    if (engagement === null || engagement === undefined) {
        return;
    }

    var cartForm = conversion.getCartForm();
    if (cartForm === null) {
        conversion.postCartAttributes(engagement);
    } else {
        conversion.injectCartAttributes(cartForm, engagement);
    }
}());
/* eslint-disable */
(function () {
    if (window.$mcSite === undefined || window.$mcSite.adwords_remarketing === undefined) {
        return;
    }

    var module = window.$mcSite.adwords_remarketing;

    if(module.installed === true) {
        return;
    }

    if (!module.settings) {
        return;
    }

    var settings = module.settings;

    if(!settings.google_conversion_id) {
        return;
    }

    window.$mcSite.runIfOptedIn(function () {
        var script = document.createElement("script");
        var conversionId = "AW-" + settings.google_conversion_id;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + conversionId;
        script.type = "text/javascript";
        script.onload = function () {
            var allow_personalization_settings = settings.google_allow_ad_personalization_signals;
            if (allow_personalization_settings === undefined) {
                allow_personalization_settings = "true";
            }

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('set', 'allow_ad_personalization_signals', allow_personalization_settings);
            gtag('js', new Date());
            gtag('config', conversionId);
        };

        document.body.appendChild(script);

        window.$mcSite.adwords_remarketing.installed = true;
    });
})();
/** This file contains code that will record an engagement with a Mailchimp campaign. */
(function () {
    var attribution = {
        checkForEngagement: function (url, uid) {
            if (this.doNotTrackEnabled()) {
                return;
            }

            var utmCampaign = this.getQueryParam("utm_campaign");
            var utmSource = this.getQueryParam("utm_source");
            var utmMedium = this.getQueryParam("utm_medium");

            if (this.isValidCampaign(utmCampaign) && this.isValidSource(utmSource) && this.isValidMedium(utmMedium)) {
                this.postEngagement(url, uid);
            }
        },

        getQueryParam: function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
            var results = regex.exec(location.search);

            return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
        },

        doNotTrackEnabled: function () {
            // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/doNotTrack
            if (navigator.doNotTrack === "1" || navigator.msDoNotTrack === "1"
                || window.doNotTrack === "1" || navigator.doNotTrack === "yes") {
                return true;
            }

            return false;
        },

        isValidCampaign: function (campaign) {
            if (!campaign) {
                return false;
            }

            var regex = new RegExp("^[a-zA-Z0-9]{10,12}(-.*)?$"); // unique_id for campaigns is 10, ads is 12
            return campaign.search(regex) !== -1;
        },

        isValidSource: function (utmSourceParam) {
            if (!utmSourceParam) {
                return false;
            }

            var regex = new RegExp("^mailchimp(-.*)?$", "i");
            return utmSourceParam.search(regex) !== -1;
        },

        isValidMedium: function (utmMediumParam) {
            if (!utmMediumParam) {
                return false;
            }

            var regex = new RegExp("^(campaign|email|page|ad)$", "i");
            return utmMediumParam.search(regex) !== -1;
        },

        createCookie: function (name, value, expirationDays) {
            var cookie_value = encodeURIComponent(value) + ";";

            // set expiration
            if (expirationDays !== null) {
                var expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + expirationDays);
                cookie_value += " expires=" + expirationDate.toUTCString() + ";";
            }

            cookie_value += "path=/";
            document.cookie = name + "=" + cookie_value;
        },

        readCookie: function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(";");

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];

                while (c.charAt(0) === " ") {
                    c = c.substring(1, c.length);
                }

                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }

            return null;
        },

        postEngagement: function (url, uid) {
            var customer_session_id = this.readCookie("mc_customer_session_id");
            var data = {
                landing_site: window.location.href,
                u: uid,
                customer_session_id: customer_session_id
            };

            var XHR = new XMLHttpRequest();
            var urlEncodedDataPairs = [];

            var key;
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    var value = data[key] ? data[key] : "";
                    urlEncodedDataPairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                }
            }

            var self = this;
            var urlEncodedData = urlEncodedDataPairs.join("&").replace(/%20/g, "+"); // replace spaces with '+'
            XHR.onreadystatechange = function () {
                if (XHR.readyState === XMLHttpRequest.DONE) {
                    var response = JSON.parse(XHR.responseText);
                    self.createCookie("mc_customer_session_id", response.customer_session_id, 30);
                }
            };

            // Set up our request
            XHR.open("POST", url, true);
            XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            XHR.send(urlEncodedData);
        }
    };

    if (window.$mcSite === undefined || window.$mcSite.attribution === undefined) {
        return;
    }

    var module = window.$mcSite.attribution;
    if (module.installed === true) {
        return;
    }

    window.$mcSite.runIfOptedIn(function () {
        attribution.checkForEngagement(module.settings.url, module.settings.uid);
        module.installed = true;
    });
}());
