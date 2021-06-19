let divRoomSelection 	= document.getElementsByTagName('roomSelection')
let divMeetingRoom 		= document.getElementsByTagName('meetingRoom')
let inputRoom 			= document.getElementsByTagName('room')
let inputName 			= document.getElementsByTagName('name')
let btnRegister 		= document.getElementsByTagName('resgister')


// variables
let roomName
let userName
let participants = {}

let sockect = io()

btnRegister.onclick = {} => {
	roomName = inputRoom.value;
	userName = inputName.value;

	if(roomName === '' || userName === ''){
		alert('Room and name are required')
	}
	else{
		let message = {
			event: 	 'joinRoom',
			userName: userName,
			roomName: roomName
		}
		sendMessage(message);
		divRoomSelection.style = "display:none";
		divMeetingRoom.style   = "display:block";
	}
}


socket.on('message', message => {
	console.log('Message arrived', message.event);

	switch(message.event){
		case 'newParticipantArrived':
			receiveVedio(message.userid, message.username)
			break
		case 'existingParticipants':
			onExistingParticipants(message.userid, message.existingUsers)
			break
		case 'receiveVedioAnswer':
			onReceiveVedioAnswer(message.senderid, message.sdpAnswer)
			break
		case 'candidate':
			addIceCandidate(message.userid, message.candidate)
			break
	}
})

function sendMessage(message){
	socket.emit('message', message)
}


function receiveVedio(userid, username){
	let video 		= document.createElement('video')
	let div 		= document.createElement('div')
	div.className 	= 'videoContainer'
	let name 		= document.createElement('div')
	video.id 		= userid
	video.autoplay 	= true
	name.appendChild(document.createTextNode(username))
	div.appendChild(video)
	div.appendChild(name)
	divMeetingRoom.appendChild(div)

	let user = {
		id: 		userid,
		username: 	username,
		video: 		video,
		rtcPeers: 	null
	}

	participants[user.id] = user
	let options = {
		remoteVideo:video,
		onicecandidate:onIceCandidate
	}

	user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, err => {
		if(err){
			return console.log(err)
		}
		this.generateOffer(onOffer)
	})

	let onOffer = (err, offer, wp) => {
		let message = {
			event: 	 	"receiveVedioFrom",
			userid:   	user.id,
			roomName: 	roomName,
			sdpOffer: 	offer
		}
		sendMessage(message)
	}

	function onIceCandidate(candidate, wp){
		let message = {
			event:  	"candidate",
			userid: 	user.id,
			roomName: 	roomName,
			candidate: 	candidate
		}
		sendMessage(message)
	}
}


function onExistingParticipants(userid, existingUsers){
	let video 		= document.createElement('video')
	let div 		= document.createElement('div')
	div.className 	= 'videoContainer'
	let name 		= document.createElement('div')
	video.id 		= userid
	video.autoplay 	= true
	name.appendChild(document.createTextNode(userName))
	div.appendChild(video)
	div.appendChild(name)
	divMeetingRoom.appendChild(div)

	let user = {
		id: 		userid,
		username: 	userName,
		video: 		video,
		rtcPeers: 	null
	}

	participants[user.id] = user

	let constraints = {
		audio: true,
		video: {
			mandatory: {
				maxWidth:     320,
				maxFrameRate: 15,
				minFrameRate: 15
			}
		}
	}

	let options = {
		localVideo: 	  video,
		onicecandidate:   onIceCandidate,
		mediaConstraints: constraints
	}

	user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, err => {
		if(err){
			return console.log(err)
		}
		this.generateOffer(onOffer)
	})

	existingUsers.forEach(element => {
		receiveVedio(element.id, element.name)
	})

	let onOffer = (err, offer, wp) => {
		let message = {
			event: 	 	"receiveVedioFrom",
			userid:   	user.id,
			roomName: 	roomName,
			sdpOffer: 	offer
		}
		sendMessage(message)
	}

	function onIceCandidate(candidate, wp){
		let message = {
			event:  	"candidate",
			userid: 	user.id,
			roomName: 	roomName,
			candidate: 	candidate
		}
		sendMessage(message)
	}
}

function onReceiveVedioAnswer(senderid, sdpAnswer){
	participants[senderid].rtcPeer.processAnswer(sdpAnswer)
}

function addIceCandidate(userid, candidate){
	participants[userid].rtcPeer.addIceCandidate(candidate)
}