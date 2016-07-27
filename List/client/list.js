import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";

import "./list.html";

/*
Template.hello.onCreated(function listOnCreated() {
	// counter starts at 0
	this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
	counter() {
		return Template.instance().counter.get();
	},
});

Template.hello.events({
	"click button"(event, instance) {
		// increment the counter when button is clicked
		instance.counter.set(instance.counter.get() + 1);
	},
});
*/

Template.list.onRendered(function listOnRendered() {
	ListInterface.Init();
});

ListInterface = {
	Mod: 3,
	ModIndex: 0,

	Init: function () {
		$("#sort").on("change", function () {
			$("#results-container").find("div.result").removeClass("hidden");
			ListInterface.Sort(parseInt($(this).val()));
			ListInterface.Search($("#search").val());
			ListInterface.BuildMods(true);
			ListInterface.ApplyMod();
		});
		$("#search").on("keyup", function () {
			ListInterface.Search($(this).val());
			ListInterface.BuildMods(true);
			ListInterface.ApplyMod();
		});

		$("#results-container").find("div.result").each(function (index, element) {
			$(this).on("click", function () {
				console.log($(this).attr("data-sort-key"));
			});
		});

		$("#results-container").find("div.result").each(function () {
	    	$(this).find(".searchable-content").each(function () {
				$(this).data("data-searchable-content", $(this).text());
			});
		});

		ListInterface.Sort(parseInt($("#sort").val()));

		$("#prev").on("click", function () {
			ListInterface.ModIndex = ListInterface.ModIndex - 1;
			ListInterface.ApplyMod();
		});
		$("#next").on("click", function () {
			ListInterface.ModIndex += 1;
			ListInterface.ApplyMod();
		});

		ListInterface.BuildMods(false);
		ListInterface.ApplyMod();
	},

	BuildMods: function (visibleOnly) {
		if (typeof visibleOnly !== "boolean") {
			visibleOnly = false;
		}

		var dataModId = 0;
		$("#results-container").find("div.result").each(function (index, element) {
			if (visibleOnly) {
				if (!$(this).hasClass("hidden")) {
					$(this).attr("data-mod-id", dataModId);
					dataModId += 1;
				}
				else {
					$(this).attr("data-mod-id", null);
				}
			}
			else {
				$(this).attr("data-mod-id", dataModId);
				dataModId += 1;
			}
		});

		var numDisplayed = 0;
		$("#results-container").find("div.result").each(function (index, element) {
			if (!$(this).hasClass("hidden")) {
				numDisplayed += 1;
			}
		});

		var startIndex = ListInterface.Mod * ListInterface.ModIndex;
		if (startIndex > (numDisplayed - 1)) {
			ListInterface.ModIndex = 0;
		}
	},

	ApplyMod: function () {
		var startIndex = ListInterface.Mod * ListInterface.ModIndex;
		var endIndex = startIndex + (ListInterface.Mod - 1);
		$("#results-container").find("div.result").each(function (index, element) {
			var rawId = parseInt($(element).attr("data-mod-id"));
			if ((rawId !== null) && (rawId !== "")) {
				var id = rawId;
				if ((id >= startIndex) && (id <= endIndex)) {
					$(element).removeClass("hidden");
				}
				else {
					$(element).addClass("hidden");
				}
			}
			else {
				if (!$(element).hasClass("hidden")) {
					$(element).addClass("hidden");
				}
			}
		});

		if (ListInterface.ModIndex === 0) {
			// First mod
			$("#prev").prop("disabled", true);
		}
		else {
			$("#prev").prop("disabled", false);
		}

		var numItems = 0;
		var numDisplayed = 0;
		$("#results-container").find("div.result").each(function (index, element) {
			numItems += 1;
			if (!$(this).hasClass("hidden")) {
				numDisplayed += 1;
			}
		});

		if (numItems <= ListInterface.Mod) {
			// Not enough items to enable multiple mods
			$("#next").prop("disabled", true);
		}
		else if (endIndex === (numItems - 1)) {
			// Last mod full
			$("#next").prop("disabled", true);
		}
		else if (numDisplayed < ListInterface.Mod) {
			// Last mode with less than mod displayed
			$("#next").prop("disabled", true);
		}
		else {
			$("#next").prop("disabled", false);
		}

		$("#mod").text(ListInterface.ModIndex + 1);
	},

	Search: function (token) {
		if ((token === null) || (token === undefined) || (token.length === 0)) {
	        // Show all
	        $("#results-container").find("div.result").each(function () {
	        	$(this).find(".searchable-content").each(function () {
					$(this).html($(this).data("data-searchable-content"));
				});
				$(this).removeClass("hidden");
	        });

	        return;
	    }
	    
	    $("#results-container").find("div.result").each(function () {
	    	$(this).find(".searchable-content").each(function () {
				$(this).html($(this).data("data-searchable-content"));
			});
			$(this).addClass("hidden");
    	});
	    var token = token.trim().toLowerCase();

	    // Blank space search token
	    if (token.length === 0) {
	        return;
	    }

	    // Find token within options and display
        $("#results-container").find("div.result").each(function () {
        	var showResult = false;
        	var result = this;

			// Search all searchable content within result
	        $(result).find(".searchable-content").each(function () {
	        	// Track comparison content vs display content
				var searchableDisplay = $(this).data("data-searchable-content");
				if (searchableDisplay) {
					// Store original searchable content for re use if not found
					var resultHTML = searchableDisplay;
					var searchable = searchableDisplay.toLowerCase();
					
					// Identify a matched token
					if (searchable.indexOf(token) > -1) {
						showResult = true;

						// Reset resulting html to build upon
						var resultHTML = "";

						// Track modified search and display strings
						var searchableDisplayMod = searchableDisplay;
						var searchableMod = searchable;
						while (searchableMod.indexOf(token) > -1) {
							// Grab from current display slice up to the matched token
							var index = searchableMod.indexOf(token);
							var sliceDisplay = searchableDisplayMod.slice(0, index + token.length);

							// Grab matched token from working slice
							var tokenDisplay = sliceDisplay.slice(index, index + token.length);

							// Apply highlighting html to matched token
							var highlightSpan = "<span class=\"highlight\">" + tokenDisplay + "</span>";

							// Update html display with currnet display slice with matched token replaced with html
							resultHTML += sliceDisplay.replace(tokenDisplay, highlightSpan);

							// Get new slices of searchables to work through based on token
							searchableMod = searchableMod.slice(index + token.length, searchableMod.length);
							searchableDisplayMod = searchableDisplayMod.slice(index + token.length, searchableDisplayMod.length);
						}

						// Update html display with remainder display slice
						resultHTML += searchableDisplayMod;

						// Set html of searchable-content item
						$(this).html(resultHTML);
					}
					else {
						// Reset html display if not found
						$(this).html(resultHTML);
					}
				}
	        });

			// Display the result container if found token
			if (showResult) {
				$(result).removeClass("hidden");
			}
    	});
	},

	Sort: function (method) {
		var container = $("#results-container");
		var items = container.find("div.result");
		var sorted = null;

		switch (method) {
			case 1:
				// A-Z
				sorted = items.sort(ListInterface.SortAlphaAsc);
				break;
			case 2:
				// Z-A
				sorted = items.sort(ListInterface.SortAlphaDesc);
				break;
			case 3:
				// Numeric Asc
				sorted = items.sort(ListInterface.SortNumericAsc);
				break;
			case 4:
				// Numeric Desc
				sorted = items.sort(ListInterface.SortNumericDesc);
				break;
			default:
				break;
		}

		if (sorted) {
			sorted.each(function () {
				 $(this).appendTo(container);
			});
		}
	},

	SortAlphaAsc: function (a, b) {
		var aSortData = JSON.parse($(a).attr("data-sort-key"));
		var bSortData = JSON.parse($(b).attr("data-sort-key"));

		var aSortAlphaKey = aSortData.alpha.toLowerCase();
		var bSortAlphaKey = bSortData.alpha.toLowerCase();

		var sort = aSortAlphaKey.localeCompare(bSortAlphaKey);

		// Alpha equal, numeric asc
		if (sort === 0) {
			var aSortNumericKey = aSortData.numeric;
			var bSortNumericKey = bSortData.numeric;

			sort = aSortNumericKey.localeCompare(bSortNumericKey, { numeric: true });
		}

		return sort;
	},

	SortAlphaDesc: function (a, b) {
		var aSortData = JSON.parse($(a).attr("data-sort-key"));
		var bSortData = JSON.parse($(b).attr("data-sort-key"));

		var aSortAlphaKey = aSortData.alpha.toLowerCase();
		var bSortAlphaKey = bSortData.alpha.toLowerCase();

		var sort = (-1) * aSortAlphaKey.localeCompare(bSortAlphaKey);

		// Alpha equal, numeric asc
		if (sort === 0) {
			var aSortNumericKey = aSortData.numeric;
			var bSortNumericKey = bSortData.numeric;

			sort = aSortNumericKey.localeCompare(bSortNumericKey, { numeric: true });
		}

		return sort;
	},

	SortNumericAsc: function (a, b) {
		var aSortData = JSON.parse($(a).attr("data-sort-key"));
		var bSortData = JSON.parse($(b).attr("data-sort-key"));

		var aSortNumericKey = aSortData.numeric;
		var bSortNumericKey = bSortData.numeric;

		var sort = aSortNumericKey.localeCompare(bSortNumericKey, { numeric: true });

		// Numeric equal, alpha asc
		if (sort === 0) {
			var aSortAlphaKey = aSortData.alpha.toLowerCase();
			var bSortAlphaKey = bSortData.alpha.toLowerCase();

			sort = aSortAlphaKey.localeCompare(bSortAlphaKey);
		}

		return sort;
	},

	SortNumericDesc: function (a, b) {
		var aSortData = JSON.parse($(a).attr("data-sort-key"));
		var bSortData = JSON.parse($(b).attr("data-sort-key"));

		var aSortNumericKey = aSortData.numeric;
		var bSortNumericKey = bSortData.numeric;

		var sort = (-1) * aSortNumericKey.localeCompare(bSortNumericKey, { numeric: true });

		// Numeric equal, alpha asc
		if (sort === 0) {
			var aSortAlphaKey = aSortData.alpha.toLowerCase();
			var bSortAlphaKey = bSortData.alpha.toLowerCase();

			sort = aSortAlphaKey.localeCompare(bSortAlphaKey);
		}

		return sort;
	}
};
