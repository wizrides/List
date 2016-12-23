document.getElementById("sort").addEventListener("change", function () {
	ListInterface.Sort(parseInt(this.value));
});
document.getElementById("search").addEventListener("keyup", function () {
	ListInterface.Search(this.value);
});

document.getElementById("results-container").querySelectorAll("div.result").forEach(function (item, i, array) {
	item.addEventListener("click", function () {
		console.log(this.getAttribute("data-sort-key"));
	});
});

ListInterface = {
	Search: function (token) {
		if ((token === null) || (token === undefined) || (token.length === 0)) {
			// Show all
			document.getElementById("results-container").querySelectorAll("div.result").forEach(function (item, i, array) {
				item.querySelectorAll(".searchable-content").forEach(function (item, i, array) {
					item.innerHTML = item.getAttribute("data-searchable-content");
				});
				item.style.display = "";
			});

			return;
		}

		// Hide all while running comparison
		document.getElementById("results-container").querySelectorAll("div.result").forEach(function (item, i, array) {
			item.querySelectorAll(".searchable-content").forEach(function (item, i, array) {
				item.innerHTML = item.getAttribute("data-searchable-content");
			});
			item.style.display = "none";
		});

		// Sanitize string for comparison
		var token = token.trim().toLowerCase();

		// Blank space search token
		if (token.length === 0) {
			return;
		}

		// Find token within options and display
		document.getElementById("results-container").querySelectorAll("div.result").forEach(function (item, i, array) {
			var showResult = false;
			var result = item;

			// Search all searchable content within result
			result.querySelectorAll(".searchable-content").forEach(function (item, i, array) {
				// Track comparison content vs display content
				var searchableDisplay = item.getAttribute("data-searchable-content");
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
							var highlightSpan = document.createElement("span");
							highlightSpan.className = "highlight";
							highlightSpan.textContent = tokenDisplay;

							// Update html display with currnet display slice with matched token replaced with html
							resultHTML += sliceDisplay.replace(tokenDisplay, highlightSpan.outerHTML);

							// Get new slices of searchables to work through based on token
							searchableMod = searchableMod.slice(index + token.length, searchableMod.length);
							searchableDisplayMod = searchableDisplayMod.slice(index + token.length, searchableDisplayMod.length);
						}

						// Update html display with remainder display slice
						resultHTML += searchableDisplayMod;

						// Set html of searchable-content item
						item.innerHTML = resultHTML;
					}
					else {
						// Reset html display if not found
						item.innerHTML = resultHTML;
					}
				}
			});

			// Display the result container if found token
			if (showResult) {
				result.style.display = "";
			}
		});
	},

	Sort: function (method) {
		var container = document.getElementById("results-container");
		var items = container.querySelectorAll("div.result");
		var itemsArray = Array.prototype.slice.call(items);
		var sorted = null;

		switch (method) {
			case 1:
				// A-Z
				sorted = itemsArray.sort(ListInterface.SortAlphaAsc);
				break;
			case 2:
				// Z-A
				sorted = itemsArray.sort(ListInterface.SortAlphaDesc);
				break;
			case 3:
				// Numeric Asc
				sorted = itemsArray.sort(ListInterface.SortNumericAsc);
				break;
			case 4:
				// Numeric Desc
				sorted = itemsArray.sort(ListInterface.SortNumericDesc);
				break;
			default:
				break;
		}

		if (sorted) {
			sorted.forEach(function (item, i, array) {
				container.appendChild(item);
			});
		}
	},

	SortAlphaAsc: function (a, b) {
		var aSortData = JSON.parse(a.getAttribute("data-sort-key"));
		var bSortData = JSON.parse(b.getAttribute("data-sort-key"));

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
		var aSortData = JSON.parse(a.getAttribute("data-sort-key"));
		var bSortData = JSON.parse(b.getAttribute("data-sort-key"));

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
		var aSortData = JSON.parse(a.getAttribute("data-sort-key"));
		var bSortData = JSON.parse(b.getAttribute("data-sort-key"));

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
		var aSortData = JSON.parse(a.getAttribute("data-sort-key"));
		var bSortData = JSON.parse(b.getAttribute("data-sort-key"));

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

(function () {
	// Initialize the data for results
	document.getElementById("results-container").querySelectorAll("div.result").forEach(function (item, i, array) {
		item.querySelectorAll(".searchable-content").forEach(function (item, i, array) {
			item.setAttribute("data-searchable-content", item.textContent);
		});
	});

	ListInterface.Sort(parseInt(document.getElementById("sort").value));
})();
