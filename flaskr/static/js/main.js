$(document).ready(function () {
	var value_anger = 50;
	var value_fear = 50;
	var value_disgust = 50;
	var value_contempt = 50;
	var value_happiness = 50;
	var value_sadness = 50;
	var value_surprise = 50;
	var global_sequence = [];

	// Header Scroll
	$(window).on('scroll', function () {
		var scroll = $(window).scrollTop();

		if (scroll >= 50) {
			$('#header').addClass('fixed');
		} else {
			$('#header').removeClass('fixed');
		}
	});


	// EMOTIONS
	// Anger
	$("input[id=anger]").on('input change', getValRangeAnger);

	function getValRangeAnger(e) {
		value_anger = e.target.value;
		$("#angerValue").text(value_anger + "%");
	}

	// Fear
	$("input[id=fear]").on('input change', getValRangeFear);

	function getValRangeFear(e) {
		value_fear = e.target.value;
		$("#fearValue").text(value_fear + "%");
	}

	// Disgust
	$("input[id=disgust]").on('input change', getValRangeDisgust);

	function getValRangeDisgust(e) {
		value_disgust = e.target.value;
		$("#disgustValue").text(value_disgust + "%");
	}

	// Contempt
	$("input[id=contempt]").on('input change', getValRangeContempt);

	function getValRangeContempt(e) {
		value_contempt = e.target.value;
		$("#contemptValue").text(value_contempt + "%");
	}

	// Happiness
	$("input[id=happiness]").on('input change', getValRangeHappiness);

	function getValRangeHappiness(e) {
		value_happiness = e.target.value;
		$("#happinessValue").text(value_happiness + "%");
	}

	// Sadness
	$("input[id=sadness]").on('input change', getValRangeSadness);

	function getValRangeSadness(e) {
		value_sadness = e.target.value;
		$("#sadnessValue").text(value_sadness + "%");
	}

	// Surprise
	$("input[id=surprise]").on('input change', getValRangeSurprise);

	function getValRangeSurprise(e) {
		value_surprise = e.target.value;
		$("#surpriseValue").text(value_surprise + "%");
	}


	// Function that handle generate and return of the emotions
	$('#generatePath').click(function (e) {
		var d = new Date
		var path = $("#pathGenerated")[0].src.replace(/\/[^\/]*$/, "/pathGenerated" + d + ".png");
		console.log(path)
		var data_emotions_path = {
			"anger": value_anger / 100.0,
			"fear": value_fear / 100.0,
			"disgust": value_disgust / 100.0,
			"contempt": value_contempt / 100.0,
			"happiness": value_happiness / 100.0,
			"sadness": value_sadness / 100.0,
			"surprise": value_surprise / 100.0,
			"date": "" + d
		}
		$("#imagePath")[0].innerHTML = `<div class="loader medium" style="margin: auto; margin-top: 25%;"></div>`;

		e.preventDefault();
		$.ajax({
			url: '/path',
			data: JSON.stringify(data_emotions_path),
			type: 'POST',
			success: function (response) {
				// Should receive the new path image
				$("#imagePath")[0].innerHTML = `<img src="${path}" id="pathGenerated" alt="Path of museum" style="width: 60%;">`
			},
			error: function (error) {
				console.log(error);
			}
		});
	});

	function setupSeqExperiment(sequence) {
		global_sequence = sequence
	}

	function normalizeData(res) {
		return new Promise(function (resolve, reject) {
			max = null;
			min = null;
			// Find max and min
			for (i in res) {
				if (i != "neutral" && i != "person" && i != "name" && i != "id" && i != "time") {
					if (max == null || res[i] > max) max = res[i]
					if (min == null || res[i] < min) min = res[i]
				}
			}
			data = {}
			//normalize and log(x + 1)
			for (i in res) {
				if (i != "neutral" && i != "person" && i != "name" && i != "id" && i != "time") {
					var normalized = (res[i] - min) / (max - min)
					data[i] = Math.log(normalized + 1)
				}
			}
			resolve(data);
		});
	}

	// Generate chart
	function generateChart(idCanvas, res, table) {
		return new Promise(async function (resolve, reject) {
			var canvas = document.getElementById(idCanvas);
			console.log("CANVAS ", canvas);

			if (canvas == null) reject("id not valid");
			var ctx = canvas.getContext('2d');
			normalizeData(res).then(async function (data) {
				name_painting = res['name']
				dataset_1 = {
					label: "you",
					data: [data['anger'], data['contempt'], data['disgust'], data['fear'], data['happiness'], data['sadness'], data['surprise']],
					backgroundColor: ['rgba(254, 164, 126, .5)', ],
					borderColor: ['rgba(198, 40, 40, .7)', ],
					borderWidth: 2
				}
				if (table) {
					data_table = await normalizeData(table)
					dataset_2 = {
						label: "general",
						data: [data_table['anger'], data_table['contempt'], data_table['disgust'], data_table['fear'], data_table['happiness'], data_table['sadness'], data_table['surprise']],
						backgroundColor: ['rgba(139, 69, 19, .5)', ],
						borderColor: ['rgba(139, 69, 19, .9)', ],
						borderWidth: 2
					}
					datasets = [dataset_1, dataset_2]
				} else datasets = [dataset_1]

				// Add comparison with other people
				var yourRes = new Chart(ctx, {
					type: 'radar',
					data: {
						labels: ["Anger", "Fear", "Disgust", "Contempt", "Happiness", "Sadness", "Surprise"],
						datasets: datasets
					},
					options: {
						responsive: true,
						scale: {
							ticks: {
								display: false,
								maxTicksLimit: 1
							}
						}
					}
				});

				resolve(yourRes);
			});
		});

	}

	// Take photos
	$('#experiment').click(function (e) {
		$.ajax({
			url: '/experiment/table',
			type: 'GET',
			success: function (table) {
				console.log(table)
				$('#modalVideo').modal({
					'show': true,
					backdrop: 'static'
				})
				navigator.permissions.query({
						name: 'camera'
					})
					.then((permissionObj) => {
						var sequence = experiment();
						setupSeqExperiment(sequence);

						//Generate path to pass in the get
						var sequenceurl = sequence.join("-");
						console.log(permissionObj.state);

						$.ajax({
							url: '/experiment?sequence=' + sequenceurl,
							type: 'GET',
							success: function (person) {
								console.log(person)
								$.ajax({
									url: '/experiment/emotion?person=' + person,
									type: 'GET',
									success: function (results) {
										$('#modalVideo').modal('hide');
										$('#modalResultExperiment').modal('show');

										// for (var i in results) {
										// 	res = results[i]
										// 	// send get request for actual value of this painting!
										// 	var container = document.getElementById("resultExperiment");
										// 	container.innerHTML += `<div><h5>${res['name']}</h5><canvas id="${res['person'] + "-" + i}"></canvas></div>`
										// 	var idCanvas = `${res['person'] + "-" + i}`
										// 	generateChart(idCanvas, res, table[i])
										// }

										(async () => {
											for (var i in results) {
												res = results[i]
												// send get request for actual value of this painting!
												var container = document.getElementById("resultExperiment");
												container.innerHTML += `<div><h5>${res['name']}</h5><canvas id="${res['person'] + "-" + i}"></canvas></div>`
												var idCanvas = `${res['person'] + "-" + i}`
												await generateChart(idCanvas, res, table[i]);
											}
										})()
									},
									error: function (error) {
										console.log(error);
									}
								})
							},
							error: function (error) {
								console.log(error);
							}
						});
					})
					.catch((error) => {
						console.log('Got error :', error);
					})
			},
			error: function (error) {
				console.log(error);
			}
		})
	});


	// Function that takes a set of images and upload it on microsoft azure returning json
	$('#saveUpload').click(function (e) {
		e.preventDefault();
	});


	$('#carouselImages').carousel({
		interval: 1500
	})

	// Function to generate a sequence of slideshow and so on
	// open on click!
	function experiment() {
		// 101 - 122
		// 201-214 NO
		// var sequence = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214]
		var sequence = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123]

		function shuffle(array) {
			var currentIndex = array.length,
				temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}
			return array;
		}

		// Used like so
		sequence = shuffle(sequence);
		var inner = "<div class='carousel-inner'>"

		var first = true;

		sequence.forEach(function (value_random) {
			if (first) {
				inner += "<div class='carousel-item active'>"
				first = false
			} else inner += "<div class='carousel-item'>"
			inner += "<img class='d-block w-100' src='/static/images/bolin/"
			inner += value_random + ".jpg'>"

			inner += "</div>";
		})
		inner += "</div><a class='carousel-control-prev' href='#experimentRunning' role='button' data-slide='prev'><span class='carousel-control-prev-icon' aria-hidden='true'></span><span class='sr-only'>Previous</span></a><a class='carousel-control-next' href='#experimentRunning' role='button' data-slide='next'><span class='carousel-control-next-icon' aria-hidden='true'></span><span class='sr-only'>Next</span></a>";

		$("#slideShowExperiment")[0].innerHTML = inner;

		$("#slideShowExperiment").carousel({
			interval: 5,
			pause: false,
			keyboard: false,
			wrap: false,
			ride: 'carousel'
		})

		$('#slideShowExperiment').hover(function () {
			$("#slideShowExperiment").carousel('cycle');
		});

		return sequence;
	}


	function openModalChart(e) {
		// "modal-" + id
		$.ajax({
			url: '/experiment/painting?id=' + e,
			type: 'GET',
			success: async function (result) {
				datas = {}

				for (var r in result) {
					datas[r] = await normalizeData(result[r]);
				}

				datasMean = {"anger": 0, "contempt": 0, "disgust": 0, "fear": 0, "happiness": 0, "sadness": 0, "surprise": 0}
				emotions = ['anger', 'contempt', 'disgust', 'fear', 'happiness', 'sadness', 'surprise']
				t = 0;

				for (var i in datas){
					t ++;
					for (el in emotions){
						emotion = emotions[el]
						datasMean[emotion] = (((datasMean[emotion]*(t-1))/t) + datas[i][emotion]/t)
					}
				}

				generateChart(`canvas-${e}`, datasMean);

				// console.log(datas);

				// // Add code for chart line
				// var ctxLine = document.getElementById(`canvasline-${e}`).getContext('2d');
				// var myRadarChart = new Chart(ctxLine, {
				// 	type: 'line',
				// 	data: {
				// 		labels: ["1s", "2s", "3s", "4s", "5s"],
				// 		datasets: [{
				// 				label: "Anger",
				// 				data: [datas['1']['anger'], datas['2']['anger'], datas['3']['anger'], datas['4']['anger'], datas['5']['anger']],
				// 				backgroundColor: [
				// 					'rgba(244, 237, 212, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(244, 237, 212, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Fear",
				// 				data: [datas['1']['fear'], datas['2']['fear'], datas['3']['fear'], datas['4']['fear'], datas['5']['fear']],
				// 				backgroundColor: [
				// 					'rgba(244, 223, 151, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(244, 223, 151, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Disgust",
				// 				data: [datas['1']['disgust'], datas['2']['disgust'], datas['3']['disgust'], datas['4']['disgust'], datas['5']['disgust']],
				// 				backgroundColor: [
				// 					'rgba(236, 200, 106, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(236, 200, 106, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Contempt",
				// 				data: [datas['1']['contempt'], datas['2']['contempt'], datas['3']['contempt'], datas['4']['contempt'], datas['5']['contempt']],
				// 				backgroundColor: [
				// 					'rgba(253, 160, 133, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(253, 160, 133, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Happiness",
				// 				data: [datas['1']['happiness'], datas['2']['happiness'], datas['3']['happiness'], datas['4']['happiness'], datas['5']['happiness']],
				// 				backgroundColor: [
				// 					'rgba(208, 131, 109, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(208, 131, 109, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Sadness",
				// 				data: [datas['1']['sadness'], datas['2']['sadness'], datas['3']['sadness'], datas['4']['sadness'], datas['5']['sadness']],
				// 				backgroundColor: [
				// 					'rgba(139, 88, 73, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(139, 88, 73, .9)',
				// 				],
				// 				borderWidth: 1
				// 			},
				// 			{
				// 				label: "Surprise",
				// 				data: [datas['1']['surprise'], datas['2']['surprise'], datas['3']['surprise'], datas['4']['surprise'], datas['5']['surprise']],
				// 				backgroundColor: [
				// 					'rgba(69, 44, 37, .5)',
				// 				],
				// 				borderColor: [
				// 					'rgba(69, 44, 37, .9)',
				// 				],
				// 				borderWidth: 1
				// 			}
				// 		]
				// 	},
				// 	options: {
				// 		responsive: true
				// 	}
				// });
			},
			error: function (error) {
				console.log(error);
			}
		});
	}


	function fillCarousel() {
		var ids = ["101", "102", "112", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123"]
		var count = 0;

		div_row = document.createElement("div");
		div_row.classList.add("row");

		div_item = document.createElement("div");
		div_item.classList.add("carousel-item", "active");

		div_item.appendChild(div_row);

		$("#container-bolin")[0].appendChild(div_item);

		for (i in ids) {
			id = ids[i]
			// Add Modals
			// Generate modal
			var div_out_modal = document.createElement("div");
			div_out_modal.classList.add("modal", "fade");
			div_out_modal.setAttribute("id", "modal-" + id)
			div_out_modal.setAttribute("tabindex", "-1")
			div_out_modal.setAttribute("role", "dialog")
			div_out_modal.setAttribute("aria-labelledby", "painting" + id)
			div_out_modal.setAttribute("aria-hidden", "true")

			var div_modal_dialog = document.createElement("div");
			div_modal_dialog.classList.add("modal-dialog", "modal-lg")
			div_modal_dialog.setAttribute("role", "document")

			var div_modal_content = document.createElement("div");
			div_modal_content.classList.add("modal-content")

			var div_modal_header = document.createElement("div");
			div_modal_header.classList.add("modal-header")

			var modal_title = document.createElement("h4");
			modal_title.classList.add("modal-title", "w-100")
			modal_title.setAttribute("id", "painting" + id)
			modal_title.innerText = "Emotions analysis";

			div_modal_header.appendChild(modal_title)

			div_modal_content.appendChild(div_modal_header)

			var div_modal_body = document.createElement("div");
			div_modal_body.classList.add("modal-body")

			var canvas = document.createElement("canvas");
			canvas.setAttribute("id", "canvas-" + id);
			div_modal_body.appendChild(canvas);

			div_modal_content.appendChild(div_modal_body);

			var statistics = document.createElement("div");
			statistics.classList.add("row", "mg-20-top");

			var statistics_left = document.createElement("div");
			statistics_left.classList.add("col");

			var statistics_left_p_title = document.createElement("h5");
			statistics_left_p_title.classList.add("category");
			statistics_left_p_title.innerText = "Age";
			statistics_left.appendChild(statistics_left_p_title);


			var statistics_left_p_ad = document.createElement("p");
			statistics_left_p_ad.classList.add("no-margin");
			// TODO: update!
			statistics_left_p_ad.innerText = "Adult: Happiness"
			statistics_left.appendChild(statistics_left_p_ad);

			var statistics_left_p_children = document.createElement("p");
			statistics_left_p_children.classList.add("no-margin");
			// TODO: update!
			statistics_left_p_children.innerText = "Children: -"
			statistics_left.appendChild(statistics_left_p_children);

			var statistics_left_p_senior = document.createElement("p");
			statistics_left_p_senior.classList.add("no-margin");
			// TODO: update!
			statistics_left_p_senior.innerText = "Senior: -"
			statistics_left.appendChild(statistics_left_p_senior);

			var statistics_left_p_title2 = document.createElement("h5");
			statistics_left_p_title2.classList.add("category", "mg-8-top");
			statistics_left_p_title2.innerText = "Sex";
			statistics_left.appendChild(statistics_left_p_title2);

			var statistics_left_p_female = document.createElement("p");
			statistics_left_p_female.classList.add("no-margin");
			// TODO: update!
			statistics_left_p_female.innerText = "Female: Sadness"
			statistics_left.appendChild(statistics_left_p_female);

			var statistics_left_p_male = document.createElement("p");
			statistics_left_p_male.classList.add("no-margin");
			// TODO: update!
			statistics_left_p_male.innerText = "Male: Happy"
			statistics_left.appendChild(statistics_left_p_male);

			var statistics_right = document.createElement("div");
			statistics_right.classList.add("col");

			var canvas_line = document.createElement("canvas");
			canvas_line.setAttribute("id", "canvasline-" + id);
			statistics_right.appendChild(canvas_line);

			statistics.appendChild(statistics_left);
			statistics.appendChild(statistics_right);

			div_modal_body.appendChild(statistics);

			var div_modal_footer = document.createElement("div");
			div_modal_footer.classList.add("modal-footer")

			var button_footer = document.createElement("button");
			button_footer.classList.add("btn", "sunny-morning-gradient", "btn-sm")
			button_footer.setAttribute("data-dismiss", "modal")
			button_footer.innerText = "Close";

			div_modal_footer.appendChild(button_footer)
			div_modal_content.appendChild(div_modal_footer)

			div_modal_dialog.appendChild(div_modal_content)
			div_out_modal.appendChild(div_modal_dialog)

			$("#modalsBulin")[0].appendChild(div_out_modal)

			// Populate carousel
			// Add dynamically all the images in carousel
			var div = document.createElement("div");
			div.classList.add("col", "work");

			var a = document.createElement("a");
			a.setAttribute("id", "a-" + id);
			a.setAttribute("data-toggle", "modal");
			a.setAttribute("data-target", "modal-" + id);
			a.classList.add("work-box", "imageBolin");

			a.addEventListener("click", function () {
				$("#modal-" + id).modal('show');
			});

			var img = document.createElement("img");
			img.setAttribute("src", "/static/images/bolin/" + id + ".jpg");

			a.appendChild(img);

			var div_inner = document.createElement("div");
			div_inner.classList.add("overlay");

			var div_inner2 = document.createElement("div");
			div_inner2.classList.add("overlay-caption");

			var p = document.createElement("p");
			var span = document.createElement("span");
			span.classList.add("icon", "icon-magnifying-glass");
			p.appendChild(span);

			div_inner2.appendChild(p);
			div_inner.appendChild(div_inner2);

			a.appendChild(div_inner);

			div.appendChild(a);

			if (count != 0 & count % 6 == 0) {
				div_row = document.createElement("div");
				div_row.classList.add("row");

				div_item = document.createElement("div");
				div_item.classList.add("carousel-item");

				div_item.appendChild(div_row)

				$("#container-bolin")[0].appendChild(div_item);
			}

			div_row.appendChild(div);
			count = count + 1;

		}

		setTimeout(function () {
			$(".imageBolin").each(function () {
				$(this)[0].addEventListener('click', openModalChart(($(this)[0].id).split('-')[1]), false);
			});
		}, 500);
	}

	fillCarousel();



	//usage:
	// readTextFile("/static/js/database.json", function (text) {
	// 	// ids = ["101", "102", "112", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123"]


	// 	$(jQuery.parseJSON(JSON.stringify(data))).each(function () {
	// 		var id = this.id;
	// 		var result_arr = this.res;
	// 		var name = this.name;

	// 		var temp_for_later_res;



	// 		// // TODO: detect if we are in url /diagrams
	// 		// var div = document.createElement("div");
	// 		// div.classList.add("col");

	// 		// var canvas = document.createElement("canvas");
	// 		// canvas.setAttribute("id", id);

	// 		// div.appendChild(canvas);

	// 		// $("#diagrams")[0].appendChild(div);

	// 		// Add code for chart
	// 		// var ctxR = document.getElementById(id).getContext('2d');
	// 		// var myRadarChart = new Chart(ctxR, {
	// 		// 	type: 'radar',
	// 		// 	data: {
	// 		// 		// anger, contempt, disgust, fear, happiness, neutral, sadness, surprise
	// 		// 		// invert fear and contempt
	// 		// 		// fear 3 contempt 1
	// 		// 		labels: ["Anger", "Fear", "Disgust", "Contempt", "Happiness", "Sadness", "Surprise"],
	// 		// 		datasets: [{
	// 		// 			label: name,
	// 		// 			data: res,
	// 		// 			backgroundColor: [
	// 		// 				'rgba(244, 240, 242, .9)',
	// 		// 			],
	// 		// 			borderColor: [
	// 		// 				'rgba(213, 208, 206, .7)',
	// 		// 			],
	// 		// 			pointBackgroundColor: [
	// 		// 				'rgba(244, 240, 242, .9)',
	// 		// 			],
	// 		// 			pointBorderColor: [
	// 		// 				'rgba(213, 208, 206, .7)',
	// 		// 			],
	// 		// 			borderWidth: 1
	// 		// 		}]
	// 		// 	},
	// 		// 	options: {
	// 		// 		responsive: true,
	// 		// 		scale: {
	// 		// 			ticks: {
	// 		// 				display: false,
	// 		// 				maxTicksLimit: 1
	// 		// 			}
	// 		// 		}
	// 		// 	}
	// 		// });


	// 	});

	// });
});