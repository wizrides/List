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
	ListInterfaceHelper.Init();
	ListInterface.Init();
});

StopWatchInterface = {
	StopWatch: function () {
		this.StartTime = 0.0;
		this.StopTime = 0.0;

		var that = this;
		this.GetElapsedTime = function () {
			return that.StopTime - that.StartTime;
		};
		this.Start = function () {
			that.StartTime = (new Date()).getTime();
		};
		this.Stop = function () {
			that.StopTime = (new Date()).getTime();
		};
	}
};

ListInterface = {
	Defaults: {
		Mod: 5
	},
	Mod: 5,
	ModIndex: 0,

	Init: function () {
		var stopwatch = new StopWatchInterface.StopWatch();
		stopwatch.Start();

		ListInterface.Mod = ListInterface.Defaults.Mod;

		ListInterface.InitControls();
		ListInterface.InitResults();

		ListInterface.Rebuild(true, false, false);

		stopwatch.Stop();
		console.log("init: " + stopwatch.GetElapsedTime());
	},

	InitControls: function () {
		var stopwatch = new StopWatchInterface.StopWatch();
		$("#sort").on("change", function () {
			stopwatch.Start();

			ListInterface.Rebuild(true, false, true);

			stopwatch.Stop();
			console.log("sort: " + stopwatch.GetElapsedTime());
		});

		$("#search").on("keyup", function () {
			stopwatch.Start();

			ListInterface.Rebuild(false, true, true);

			stopwatch.Stop();
			console.log("search: " + stopwatch.GetElapsedTime());
		});
		$("#search-button").click(function (e) {
			e.preventDefault();
			ListInterface.Rebuild(false, true, true);
		});

		$(".list-btn-prev").on("click", function () {
			stopwatch.Start();

			ListInterface.ModIndex = ListInterface.ModIndex - 1;
			ListInterface.RebuildPage();

			stopwatch.Stop();
			console.log("previous paging: " + stopwatch.GetElapsedTime());
		});
		$(".list-btn-next").on("click", function () {
			stopwatch.Start();

			ListInterface.ModIndex = ListInterface.ModIndex + 1;
			ListInterface.RebuildPage();

			stopwatch.Stop();
			console.log("next paging: " + stopwatch.GetElapsedTime());
		});
	},

	InitResults: function () {
		$("#results-container").find("div.result").each(function (index, element) {
			$(this).on("click", function () {
				console.log($(this).attr("data-sort-key"));
			});
	    	$(this).find(".searchable-content").each(function () {
				$(this).data("data-searchable-content", $(this).text());
			});
		});
	},

	Rebuild: function (sort, filter, filteredOnly) {
		if (typeof sort !== "boolean") {
			sort = false;
		}
		if (typeof filter !== "boolean") {
			filter = false;
		}
		if (typeof filteredOnly !== "boolean") {
			filteredOnly = false;
		}

		var startIndex = ListInterface.Mod * ListInterface.ModIndex;
		var endIndex = startIndex + (ListInterface.Mod - 1);

		var updatePageControls = true;

		var numItems = 0;
		var numVisible = 0;
		var numInPage = 0;
		var dataModId = 0;

		if (sort) {
			ListInterface.Sort(parseInt($("#sort").val()));
		}

		$("#results-container").find("div.result").each(function (index, element) {
			var $element = $(element);

			// Apply list logic based on rebuild request
			if (filter) {
				ListInterface.Search(element, $("#search").val());
			}

			var incrementDataModId = ListInterface.BuildMod(element, dataModId, filteredOnly);
			if (incrementDataModId) {
				dataModId += 1;
			}
			ListInterface.ApplyMod(element);

			ListInterface.RebuildDisplay(element);

			// Update counts of result states
			numItems += 1;
			if (!$element.hasClass("hidden")) {
				numVisible += 1;
			}
			if (!$element.hasClass("not-in-page")) {
				numInPage += 1;
			}
		});

		if (filter) {
			// If searching doesn't produce enough results to fill to current mod viewed, start at 0 again
			if (startIndex > (numVisible - 1)) {
				ListInterface.ModIndex = 0;
				ListInterface.RebuildPage();
				updatePageControls = false;
			}
		}

		if (updatePageControls) {
			ListInterface.UpdatePageControls(startIndex, endIndex, numItems, numVisible, numInPage);
		}
	},

	RebuildDisplay: function (element) {
		var $element = $(element);
		if ($element.hasClass("showing")) {
			$element.removeClass("hidden")
				.removeClass("not-in-page");
		}
		else if ($element.hasClass("hiding") && $element.hasClass("hiding-not-in-page")) {
			$element.addClass("hidden")
				.addClass("not-in-page");
		}
		else if ($element.hasClass("hiding")) {
			$element.addClass("hidden")
				.removeClass("not-in-page");
		}
		else if ($element.hasClass("hiding-not-in-page")) {
			$element.addClass("not-in-page")
				.removeClass("hidden");
		}

		// Clean up transition classes
		$element.removeClass("showing")
			.removeClass("hiding")
			.removeClass("hiding-not-in-page");
	},

	RebuildPage: function () {
		var startIndex = ListInterface.Mod * ListInterface.ModIndex;
		var endIndex = startIndex + (ListInterface.Mod - 1);

		var numItems = 0;
		var numVisible = 0;
		var numInPage = 0;

		$("#results-container").find("div.result").each(function (index, element) {
			var $element = $(element);
			ListInterface.ApplyMod(element);
			ListInterface.RebuildDisplay(element);

			// Update counts of result states
			numItems += 1;
			if (!$element.hasClass("hidden")) {
				numVisible += 1;
			}
			if (!$element.hasClass("not-in-page")) {
				numInPage += 1;
			}
		});

		ListInterface.UpdatePageControls(startIndex, endIndex, numItems, numVisible, numInPage);
	},

	UpdatePageControls: function (startIndex, endIndex, numItems, numVisible, numInPage) {
		// Update paging button states
		if (ListInterface.ModIndex === 0) {
			$(".list-btn-prev").prop("disabled", true);
		}
		else {
			$(".list-btn-prev").prop("disabled", false);
		}

		// Add one to endIndex for this check, since the nth item has index (n-1)
		if (numVisible <= (endIndex + 1)) {
			$(".list-btn-next").prop("disabled", true);
		}
		else {
			$(".list-btn-next").prop("disabled", false);
		}

		// Update result count display
		if (numVisible > 0) {
			if (numVisible != numItems) {
				$(".list-lbl-mod").text("Showing " + (startIndex + 1) + " to " + (startIndex + numInPage) + " of "
					+ (numVisible) + " results (" + (numItems) + " total)");
			}
			else {
				$(".list-lbl-mod").text("Showing " + (startIndex + 1) + " to " + (startIndex + numInPage) + " of "
					+ (numVisible) + " items");
			}
		}
		else {
			$(".list-lbl-mod").text("No results");
		}
	},

	SetMod: function(newMod, keepPlace) {
		if (typeof keepPlace !== "boolean") {
			keepPlace = false;
		}

		var newModIndex = 0;
		if (keepPlace) {
			var oldMod = ListInterface.Mod;
			var oldModIndex = ListInterface.ModIndex;
			var newModIndex = Math.floor(((oldModIndex * oldMod) / newMod));
		}

		ListInterface.Mod = newMod;
		ListInterface.ModIndex = newModIndex;

		ListInterface.Rebuild(false, false, true);
	},

	BuildMod: function (element, dataModId, visibleOnly) {
		var incrementDataModId = false;
		if (typeof visibleOnly !== "boolean") {
			visibleOnly = false;
		}

		var $element = $(element);

		// Apply mod identifier ignoring filtered
		if (visibleOnly) {
			if ($element.hasClass("showing")
				|| (!$element.hasClass("hidden") && !$element.hasClass("hiding") && !$element.hasClass("hiding-not-in-page"))) {
				$element.attr("data-mod-id", dataModId);
				incrementDataModId = true;
			}
			else {
				$element.attr("data-mod-id", null);
			}
		}
		else {
			$element.attr("data-mod-id", dataModId);
			incrementDataModId = true;
		}

		return incrementDataModId;
	},

	ApplyMod: function (element) {
		var $element = $(element);
		var startIndex = ListInterface.Mod * ListInterface.ModIndex;
		var endIndex = startIndex + (ListInterface.Mod - 1);

		var dataModId = parseInt($element.attr("data-mod-id"));
		if ((dataModId !== null) && (dataModId !== "") && (dataModId !== NaN)) {
			if ((dataModId >= startIndex) && (dataModId <= endIndex)) {
				// In view of current mod
				$element.addClass("showing");
			}
			else {
				// Maintain filtered state
				if ($element.hasClass("hidden") && !$element.hasClass("showing")) {
					$element.addClass("hiding");
				}

				// Outside of current mod
				$element.removeClass("showing")
					.addClass("hiding-not-in-page");
			}
		}
	},

	Search: function (element, token) {
		var $element = $(element);
		if ((token === null) || (token === undefined) || (token.length === 0)) {
	        // Showing all, reset content, set for showing
        	$element.find(".searchable-content").each(function () {
				$(this).html($(this).data("data-searchable-content"));
			});
			$element.removeClass("hiding")
				.addClass("showing");

	        return;
	    }

	    // Match to show approach, set up for hiding first
    	$element.find(".searchable-content").each(function () {
			$(this).html($(this).data("data-searchable-content"));
		});
		$element.removeClass("showing")
			.addClass("hiding");

    	// Sanitize input token
	    var token = token.trim().toLowerCase();

	    // Blank space search token
	    if (token.length === 0) {
	        return;
	    }

	    if ($element.hasClass("hidden")) {
	    	return;
	    }

	    // Find token within options and display
    	var showResult = false;

		// Search all searchable content within result
        $element.find(".searchable-content").each(function () {
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
						var highlightSpan = "<span class=\"blue-highlight\">" + tokenDisplay + "</span>";

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
			$element.removeClass("hiding")
				.addClass("showing");
		}
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

ListInterfaceHelper = {
	Init: function () {
		$("#set-mod").val(ListInterface.Defaults.Mod);
		$("#btn-set-mod").on("click", function () {
			var mod = parseInt($("#set-mod").val());

			if (mod > 0) {
				var stopwatch = new StopWatchInterface.StopWatch();
				stopwatch.Start();

				ListInterface.SetMod(mod, true);

				stopwatch.Stop();
				console.log("set mod: " + stopwatch.GetElapsedTime());
			}
		});

		var count = 500;
		for (var i = 1; i <= count; i++) {
			var title = "Title " + i;
			var subTitle = "Sub Title " + i;
			var themeLabel = "Science Theme:";
			var theme = "theme " + i + ";";
			var timeRangeLabel = "Time range:";
			var timeRange = (2000 + i) + " - " + (2000 + (i + count));
			var locationLabel = "Locations:";
			var location = "CO" + i + ";";

			var dataSortKey = {
				alpha: title,
				numeric: (2000 + i).toString()
			};
			var dataSortKeyString = JSON.stringify(dataSortKey);

			var result = document.createElement("div");
			result.setAttribute("class", "result not-in-page");
			result.setAttribute("data-sort-key", dataSortKeyString);

			var resultDisplayContainer = document.createElement("div");
			resultDisplayContainer.setAttribute("class", "result-shown");

			var resultLeftContainer = document.createElement("div");
			resultLeftContainer.setAttribute("class", "result-left float-left");

			var dlLeftContainer = document.createElement("dl");

			var titleElement = document.createElement("dt");
			titleElement.setAttribute("class", "result-title searchable-content");
			titleElement.innerHTML = title;
			var subTitleElement = document.createElement("dd");
			subTitleElement.setAttribute("class", "result-subtitle searchable-content");
			subTitleElement.innerHTML = subTitle;

			dlLeftContainer.appendChild(titleElement);
			dlLeftContainer.appendChild(subTitleElement);

			var themeLabelElement = document.createElement("dt");
			themeLabelElement.innerHTML = themeLabel;
			var themeElement = document.createElement("dd");
			themeElement.setAttribute("class", "searchable-content");
			themeElement.innerHTML = theme;

			dlLeftContainer.appendChild(themeLabelElement);
			dlLeftContainer.appendChild(themeElement);

			var locationLabelElement = document.createElement("dt");
			locationLabelElement.innerHTML = locationLabel;
			var locationElement = document.createElement("dd");
			locationElement.setAttribute("class", "searchable-content");
			locationElement.innerHTML = location;

			dlLeftContainer.appendChild(locationLabelElement);
			dlLeftContainer.appendChild(locationElement);

			resultLeftContainer.appendChild(dlLeftContainer);

			var resultRightContainer = document.createElement("div");
			resultRightContainer.setAttribute("class", "result-right float-right");

			var dlRightContainer = document.createElement("dl");

			var timeRangeLabelElement = document.createElement("dt");
			timeRangeLabelElement.innerHTML = timeRangeLabel;
			var timeRangeElement = document.createElement("dd");
			timeRangeElement.setAttribute("class", "searchable-content");
			timeRangeElement.innerHTML = timeRange;

			dlRightContainer.appendChild(timeRangeLabelElement);
			dlRightContainer.appendChild(timeRangeElement);

			resultRightContainer.appendChild(dlRightContainer);

			resultDisplayContainer.appendChild(resultLeftContainer);
			resultDisplayContainer.appendChild(resultRightContainer);

			result.appendChild(resultDisplayContainer);

			document.getElementById("results-container").appendChild(result);
		}
	}
};
