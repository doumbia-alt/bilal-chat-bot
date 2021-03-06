var $messages = $(".messages-content"),
  d,
  h,
  m,
  speech
i = 0

$(window).on("load", function () {
  $messages.mCustomScrollbar()
  speech = speechSynthesis
})

function updateScrollbar() {
  $messages.mCustomScrollbar("update").mCustomScrollbar("scrollTo", "bottom", {
    scrollInertia: 10,
    timeout: 0
  })
}

function setDate() {
  d = new Date()
  if (m != d.getMinutes()) {
    m = d.getMinutes()
    $('<div class="timestamp">' + d.getHours() + ":" + m + "</div>").appendTo(
      $(".message:last")
    )
  }
}

function insertPersonalMessage(message) {
  $('<div class="message message-personal">' + message + "</div>")
    .appendTo($(".mCSB_container"))
    .addClass("new")
  updateScrollbar()
}

function insertLoadingMessage() {
  $(
    '<div class="message loading new"><figure class="avatar"><img src="../static/img/bat.png"/></figure><span></span></div>'
  ).appendTo($(".mCSB_container"))
  updateScrollbar()
}

function insertResponseMessage(response) {
  $(".message.loading").remove()
  $(
    '<div class="message new"><figure class="avatar"><img src="../static/img/bat.png"/></figure>' +
      response +
      "</div>"
  )
    .appendTo($(".mCSB_container"))
    .addClass("new")
  setDate()
  updateScrollbar()
}

function insertAudioMessage(audioUrl) {
  audioElement =
    '<audio controls autoplay><source src="' +
    audioUrl +
    '" type="audio/mp3"></audio>'
  $(
    '<div class="message new"><figure class="avatar"><img src="../static/img/bat.png"/></figure>' +
      audioElement +
      "</div>"
  )
    .appendTo($(".mCSB_container"))
    .addClass("new")
  setDate()
  updateScrollbar()
}

function insertKeyboardMessage() {
  message = $(".message-input").val()
  if ($.trim(message) == "") {
    return false
  }
  insertPersonalMessage(message)
  insertLoadingMessage()
  sendToServer(message)
}

function sendToServer(message) {
  fetch("/chat", {
    method: "POST",

    body: JSON.stringify({ message: message }),

    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then((response) => response.json())
    .then((json) => parseResponse(json))
}

function parseResponse(json) {
  if (json["action"] === undefined) {
    insertResponseMessage("something went wrong bot did not reply")
  } else if (json["action"] === "display") {
    insertResponseMessage(json["message"])

    // text to speech
    let voice = speech.getVoices()[5]
    let utterance = new SpeechSynthesisUtterance(json["message"])
    utterance.voice = voice
    speech.speak(utterance)
  } else if (json["action"] === "display-no-audio") {
    insertResponseMessage(json["message"])
  } else if (json["action"] === "play") {
    insertResponseMessage(json["message"])
    insertAudioMessage(json["audio"])
  }
}

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var recognition = new SpeechRecognition()
recognition.lang = "en-US"
recognition.interimResults = false

$(".message-record").click(function () {
  if (!$(".message-record").hasClass("Rec")) {
    $(".message-record").addClass("Rec")
    recognition.start()
    return
  }
  if ($(".message-record").hasClass("Rec")) {
    $(".message-record").removeClass("Rec")
    recognition.abort()
    return
  }
})

recognition.onresult = function (event) {
  var speechResult = event.results[0][0].transcript.toLowerCase()
  $(".message-record").removeClass("Rec")
  insertPersonalMessage(speechResult)
  insertLoadingMessage()
  sendToServer(speechResult)
}

$("#settings-form").on("submit", function (e) {
  e.preventDefault()

  const result = e.target.elements[0].value.split(",")

  $("#extraLargeModal").modal("hide")

  fetch("/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ surah_reciter: result[0], verse_reciter: result[1] })
  }).catch((e) => window.alert(e))
})

$(".message-submit").click(function () {
  insertKeyboardMessage()
  $(".message-input").val(null)
})

$(window).on("keydown", function (e) {
  if (e.which == 13) {
    insertKeyboardMessage()
    $(".message-input").val(null)
    return false
  }
})
