/**
 * Docs
 * 
 * npm install discord.js@~12.5.3 erela.js erela.js-filters discord-buttons quickmongo erela.js-apple erela.js-deezer erela.js-facebook erela.js-spotify chalk@~4.1.2
 *
 * add token and provide prefix
 * if you have own lavalink you can add your own and set secure to **FALSE**
 * to run bot use **yarn start**
 */


//=============================== Config ========================================

const prefix = '!';
const token = 'OTY0NDU4NjgxNTQ4ODIwNDkw.Ylk8JA.53e96H4OW8WGDKOGtv3guHl6aEg'; //
const config = {
	github: 'https://github.com/ImJustNon/Music-bot-with-request-channel',
	mongoURL: 'mongodb://newuser:newuser@cluster0-shard-00-00.uf6th.mongodb.net:27017,cluster0-shard-00-01.uf6th.mongodb.net:27017,cluster0-shard-00-02.uf6th.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-6cm745-shard-0&authSource=admin&retryWrites=true&w=majority',
	Music: {
		nodes: [
			{
				identifier: "main",
				host: "lavalink.islantay.tk",
				port: 8880,
				password: "waifufufufu",
				secure: false,
				retryAmount: Infinity,
				retryDelay: 3000,
        	},
		],
		spotify: {
			clientID: "74354de9255e43abab3fdc86c0064fb7",
			clientSecret: "eb0f21f5f28840ef91358c26d4c2d9f0",
		},
		embed: {
			default: {
				color: '#fa5c00', //RANDOM
				defaultimage: 'https://cdn.discordapp.com/attachments/887363452304261140/964737487383711764/standard_7.gif',
				banner: 'https://cdn.discordapp.com/attachments/887363452304261140/964713073527099392/standard_4.gif',
			},
		},
	},
};
const radioStation = {
	ecq_18k: 'http://112.121.151.133:8147/live',
};
const embed_config = {
	color: '#fa5c00', //RANDOM
	helpBanner: 'https://cdn.discordapp.com/attachments/887363452304261140/964767665157730344/standard_8.gif',
};
const emoji = {
	music: ':notes:',
	room: ':house_with_garden:',
	time: ':timer:',
	out: ':outbox_tray:',
	in: ':inbox_tray:',
};

//========================= import =================
const { Client, MessageEmbed } = require("discord.js");
const { Manager } = require("erela.js");
const { Database } = require("quickmongo");
const chalk = require("chalk");


//========================= Create Client =========================

const client = new Client();
//========================= Import Discord-butons ========================= 
require('discord-buttons')(client);
const { MessageActionRow, MessageButton } = require("discord-buttons");
const { MessageMenuOption, MessageMenu } = require("discord-buttons");


//========================= Data-Base =========================
const db = new Database(config.mongoURL);
db.on("ready", () => {
    console.log(chalk.bold.magenta("[Data-Base] ") + chalk.bold.white("Mongodb has Connected!"));
});
db.connect();
//========================= Erelajs Plugin =========================
const Filter = require("erela.js-filters");
const Spotify = require("erela.js-spotify");
const Deezer = require("erela.js-deezer");
const AppleMusic = require("erela.js-apple");
const Facebook = require("erela.js-facebook");
//=======================================================================
const manager = new Manager({
	nodes: config.Music.nodes,
	plugins: [
		new Filter(),
		new Deezer(),
		new AppleMusic(),
		new Facebook(),
		new Spotify({
			clientID: config.Music.spotify.clientID,
			clientSecret: config.Music.spotify.clientSecret,
		}),
	],
	send(id, payload) {
		const guild = client.guilds.cache.get(id);
		if (guild) guild.shard.send(payload);
	},
});
//========================= Node event =========================
manager.on("nodeConnect", node =>{
	console.log(chalk.bold.blue("[Nodes] ") + chalk.bold.white(`Node ${node.options.identifier} Connected!`));
});
manager.on("nodeError", (node, error) =>{
	console.log(chalk.bold.blue("[Nodes] ") + chalk.bold.white(`Node ${node.options.identifier} had an `) + chalk.bold.bgRedBright(" Error ") + chalk.bold.white(' : ') + chalk.bold.redBright(`${error.message}`));
});
manager.on('nodeDisconnect', (node) =>{
	console.log(chalk.bold.blue("[Nodes] ") + chalk.bold.white(`Node ${node.options.identifier} Disconnected!`));
});

//========================= Erela.js Event =========================
manager.on("trackStart", async(player, track) => {
	const channel = client.channels.cache.get(player.textChannel);
	const voice = client.channels.cache.get(player.voiceChannel); 
	
	let musicChannelID = await db.get(`music_${player.guild}_channel`);
	if(player.textChannel == musicChannelID){
	//import data
	
		let trackEmbedID = await db.get(`music_${player.guild}_track_message`);
		let queueMessageID = await db.get(`music_${player.guild}_queue_message`);

		//get data
		let musicChannel = client.channels.cache.get(musicChannelID);
		let trackEmbed = await musicChannel.messages.cache.get(trackEmbedID);
		let queueMessage = await musicChannel.messages.fetch(queueMessageID);

		await trackEmbed.edit(track_msg_Embed(client, player));
		await queueMessage.edit(queue_msg(client, player));
	}
	else {
		const embed = new MessageEmbed()
			.setColor(embed_config.color)
			.setThumbnail(track.thumbnail)
			.addFields(
				[
					{
						name: `${emoji.music} | กำลังเล่นเพลง`,
						value: `[${track.title}](${track.uri})`, 
						inline: false,
					},
					{
						name: `${emoji.room} | ในห้อง`,
						value: `<#${voice.id}>`, 
						inline: true,
					},
					{
						name: `${emoji.time} | ความยาว`,
						value: `\`${convertTime(track.duration)}\``, 
						inline: true,
					},
					{
						name: `${emoji.in} | ขอเพลงโดย`,
						value: `<@${track.requester.id}>`, 
						inline: true,
					},
				],
			)
			.setFooter(client.user.tag, client.user.avatarURL())
			.setTimestamp()
		channel.send(embed);
	}
});
manager.on("queueEnd", async(player) => {
	const channel = client.channels.cache.get(player.textChannel);
	const musicChannelID = await db.get(`music_${player.guild}_channel`);
	
	
	const msg = await channel.send('❗ | คิวหมดเเล้วน่ะ');
	if(player.textChannel == musicChannelID){
		msg.delete({ timeout: 5000 });
	}
	player.destroy();
});
manager.on('playerDestroy', async(player) => {
	const channel = client.channels.cache.get(player.textChannel);
	const musicChannelID = await db.get(`music_${player.guild}_channel`);

	if(player.textChannel == musicChannelID){
		//import data
		let trackEmbedID = await db.get(`music_${player.guild}_track_message`);
		let queueMessageID = await db.get(`music_${player.guild}_queue_message`);
		//get data
		let musicChannel = client.channels.cache.get(musicChannelID);
		let trackEmbed = await musicChannel.messages.cache.get(trackEmbedID);
		let queueMessage = await musicChannel.messages.fetch(queueMessageID);

		const defaultTrackEmbed = new MessageEmbed()
			.setColor(config.Music.embed.default.color)
			.setTitle('ยังไม่มีเพลงเล่นอยู่ ณ ตอนนี้')
			.setImage(config.Music.embed.default.defaultimage)
			.setFooter(client.user.tag)
			.setTimestamp()
		await queueMessage.edit('**คิวเพลง:**\nเข้าช่องเสียง และพิมพ์ชื่อเพลงหรือลิงก์ของเพลง เพื่อเปิดเพลงน่ะ');
		await trackEmbed.edit(defaultTrackEmbed);	
	}
});

//========================= Client Event =========================
client.on("ready", () =>{
	console.log(chalk.bold.greenBright("[Client] ") + chalk.bold.white(`${client.user.tag} Is Ready!`));
	manager.init(client.user.id);
});
client.on("ready", () =>{
	// set activity
	let i = 0;
	let activity = ['Music', 'เพลง', '歌', '歌曲', 'песня', 'गाना', '노래'];
	setInterval(async() =>{
		if(i === activity.length) i = 0;
		try{
			await client.user.setActivity(`${activity[i]} | ${prefix}help | ${client.guilds.cache.size} เซิฟเวอร์`, {
				type: "STREAMING",
				url: "https://www.twitch.tv/im_just_non",
			});
		}
		catch(err){
			await client.user.setActivity(`${activity[i]} | ${prefix}help | ${client.guilds.cache.size} เซิฟเวอร์`, {
				type: "STREAMING",
				url: "https://www.twitch.tv/im_just_non",
			});
		}
		i++
	}, 5 * 1000);
});

client.on("raw", (d) =>{
	manager.updateVoiceState(d)
});

client.on("message", async (message) =>{
	if(message.author.bot) return;
	if (message.author.bot || message.channel.type === "dm") return;  

	let guild_prefix = await get_prefix(message.guild.id)
    let args = message.content.slice(guild_prefix.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
	
	
	// if channel is Music channel
	const musicChannel = await db.get(`music_${message.guild.id}_channel`);
	if(musicChannel !== null){
		if(message.channel.id === musicChannel){
			Music_Channel_Function(client, message, args);
		}
	}

	if (!message.content.startsWith(guild_prefix)) return;
	if(cmd === 'play' || cmd === 'p'){
		play(client, message, args);
	}
	else if(cmd === 'pause'){
		pause(client, message, args);
	}
	else if(cmd === 'resume'){
		resume(client, message, args);
	}
	else if(cmd === 'skip' || cmd === 'sk'){
		skip(client, message, args);
	}
	else if(cmd === 'stop' || cmd === 'dc' || cmd === 'disconnect'){
		stop(client, message, args);
	}
	else if(cmd === 'nowplaying' || cmd === 'np'){
		nowplaying(client, message, args);
	}
	else if(cmd === 'queue' || cmd === 'q'){
		queue(client, message, args);
	}
	else if(cmd === 'loop' || cmd === 'repeat'){
		loop(client, message, args);
	}
	else if(cmd === 'volume' || cmd === 'vol'){
		volume(client, message, args);
	}
	else if(cmd === 'shuffle'){
		shuffle(client, message, args);
	}
	else if(cmd === 'j' || cmd === 'join' || cmd === 'connect'){
		connect(client, message, args);
	}
	else if(cmd === 'radio'){
		radio(client, message, args);
	}
	else if(cmd === 'clearqueue'){
		clearQueue(client, message, args);
	}
	else if(cmd === 'help' || cmd === 'h'){
		help(client, message, args);
	}
	else if(cmd === 'filter'){
		filter(client, message, args);
	}
	else if(cmd === 'setup'){
		setup(client, message, args);
	}
	else if(cmd === 'prefix'){
		Prefix(client, message, args);
	}
	else if(cmd === 'seek' || cmd === 'seekto'){
		seek(client, message, args);
	}
	else {
		if(message.content.startsWith(prefix)){
			return message.channel.send('⚠ | ฮืมม.. รู้สึกว่าคำสั่งนี้ไม่สามารถใช้ได้หรือไม่มีคำสั่งนี้น่ะ');
		}
	}
});

//================================================== Commands ==================================================

const help = async(client, message, args) =>{
	let home_embed = new MessageEmbed()
		.setColor(embed_config.color)
		.setAuthor('📗 หน้าต่างช่วยเหลือ', message.guild.iconURL())
		.addFields(
			[
				{
					name: '🟠 | Source Code',
					value: `[โค้ดบอท](${config.github})`,
					inline: true,
				}
			]
		)
		.setImage(embed_config.helpBanner)
	let help_embed = new MessageEmbed()
		.setColor(embed_config.color)
		.setAuthor('🎶 คำสั่งเพลง', message.guild.iconURL())
		.addFields(
			[
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}play \``,
					value: `เล่นเพลง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}pause \``,
					value: `หยุดชั่วคราว`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}resume \``,
					value: `เล่นเพลงต่อ`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}skip \``,
					value: `ข้ามเพลง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}stop \``,
					value: `หยุดเพลง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}nowplaying \``,
					value: `เพลงที่กำลังเล่น`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}queue \``,
					value: `รายการคิว`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}loop \``,
					value: `วนซ้ำ`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}volume \``,
					value: `ความดังเสียง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}shuffle \``,
					value: `สุ่มเรียงคิวใหม่`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}connect \``,
					value: `เข้าช่องเสียง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}radio \``,
					value: `ฟังเพลงจากสถานีวิทยุ`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}clearqueue \``,
					value: `ล้างคิวเพลง`, 
					inline: true,
				},
				{
					name: `:notes: | \` ${await get_prefix(message.guild.id)}seek \``,
					value: `ข้ามเวลาเพลง`, 
					inline: true,
				},	
			]
		)
		.setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
		.setTimestamp();

	let filter_help = new MessageEmbed()
		.setColor(embed_config.color)
		.setAuthor('🎛️ Filter', message.guild.iconURL())
		.addFields([
			{
				name: `วิธีใช้คำสัง Filter \`${await get_prefix(message.guild.id)}filter  < filter >\` :`,
				value: `
\`\`\`
bassboost , nightcore , vaporwave , pop , soft , treblebass , eightdimension , karaoke , vibrato , tremolo 
\`\`\``,
				inline: false,
			},
			{
				name: '♻ Reset :',
				value: `\`${await get_prefix(message.guild.id)}filter reset\``,
				inline: false,
			},
		])
		.setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
		.setTimestamp();
		
	let setting_embed = new MessageEmbed()
		.setAuthor('⚙ คำสั่งตั้งค่า', message.guild.iconURL())
		.addFields(
			[
				{
					name: `:gear: | \` ${await get_prefix(message.guild.id)}setup \``,
					value: `สร้างห้องสำหรับเล่นเพลง`, 
					inline: true,
				},
				{
					name: `:gear: | \` ${await get_prefix(message.guild.id)}prefix \``,
					value: `ตั้งค่า Prefix เซิฟเวอร์`, 
					inline: true,
				},
			]
		)
		.setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
		.setTimestamp();

	let bhome = new MessageButton()
        .setLabel(`หน้าหลัก`)
        .setID(`home`)
        .setStyle(`SUCCESS`)
        .setEmoji(`🏡`)
	let bmusic = new MessageButton()
        .setLabel(`คำสั่งเพลง`)
        .setID(`music`)
        .setStyle(`PRIMARY`)
        .setEmoji(`🎶`)
	let bfilter = new MessageButton()
        .setLabel(`คำสั่งฟิลเตอร์`)
        .setID(`filter`)
        .setStyle(`PRIMARY`)
        .setEmoji(`🎛️`)
	let bsetting = new MessageButton()
        .setLabel(`คำสั่งตั้งค่า`)
        .setID(`setting`)
        .setStyle(`PRIMARY`)
        .setEmoji(`⚙`)
	let bclose = new MessageButton()
		.setLabel(`ปิดหน้าต่าง`)
		.setID(`close`)
		.setStyle(`red`)
		.setEmoji(`❌`)
	let row = new MessageActionRow()
		.addComponents(bhome, bmusic, bfilter, bsetting, bclose);

	const filter = ( button ) => button.clicker.id === message.author.id;
	const MESSAGE = await message.channel.send(home_embed,row);
	const collector = MESSAGE.createButtonCollector(filter, { time : 60000 });
	collector.on('collect', async (b) => {
		if(b.id == 'home'){
			MESSAGE.edit(home_embed, row);
		}
		else if(b.id == 'music'){
			MESSAGE.edit(help_embed, row);
		}
		else if(b.id == 'filter'){
			MESSAGE.edit(filter_help, row);
		}
		else if(b.id == 'setting'){
			MESSAGE.edit(setting_embed, row);
		}
		else if(b.id == 'close'){
			MESSAGE.delete();
		}
		await b.reply.defer()
	});
	collector.on('end', async(b) => {
		if(MESSAGE){
			MESSAGE.edit(`ดูเหมือนว่าคำสั่งนี้จะหมดเวลาการใช้งานเเล้วน่ะ หากต้องการใช้คำสั่งนี้ต่อโปรดพิมพ์ \` ${await get_prefix(message.guild.id)}help \` อีกครั้งน่ะ`).then(async msg =>{
				await msg.delete({ timeout : 10000 });
			});
		}
	});
}
const play = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!args[0]) return message.channel.send('⚠ | โปรดระบุเพลงที่ต้องการด้วยน่ะ');
	else {
		let queary = args.join(' ');
		let player = manager.players.get(message.guild.id);
		if(!player){
			player = manager.create({
				guild: message.guild.id,
				voiceChannel: message.member.voice.channel.id,
				textChannel: message.channel.id,
				selfDeafen: false,
				selfMute: false,
				volume: 80,
			});
		}
		if(player.state !== 'CONNECTED') player.connect();
		let res = await manager.search(queary, message.author);

		switch(res.loadType){
			case "LOAD_FAILED":
			{
				if(!player.queue.current) player.destroy();
				await message.channel.send(
					new MessageEmbed()
						.setColor(embed_config.color)
						.setDescription('⚠ | ไม่สามารถโหลดผลการค้นหาได้')
				);
			}
			break;
			case "NO_MATCHES":
			{
				if(!player.queue.current) player.destroy();
				await message.channel.send(
					new MessageEmbed()
						.setColor(embed_config.color)
						.setDescription(`❌ | ไม่พบผลการค้นหาสำหรับ ${queary}`)
				);
			}
			break;
			case "PLAYLIST_LOADED":
			{
				await player.queue.add(res.tracks);
				message.channel.send(
					new MessageEmbed()
						.setColor(embed_config.color)
						.setDescription(`✅ | เพิ่ม Playlist: \`${res.playlist.name}\` เรียบร้อยเเล้ว`)
				);
				if(!player.playing){
					player.play();
				}
			}
			break;
			case "SEARCH_RESULT":
			{
				await player.queue.add(res.tracks[0]);
				message.channel.send(
					new MessageEmbed()
						.setColor(embed_config.color)
						.setDescription(`✅ | เพิ่มเพลง \`${res.tracks[0].title}\` เรียบร้อยเเล้ว`)
				);
				if(!player.playing){
					player.play();
				}
			}
			break;
			case "TRACK_LOADED":
			{
				await player.queue.add(res.tracks[0]);
				message.channel.send(
					new MessageEmbed()
						.setColor(embed_config.color)
						.setDescription(`✅ เพิ่มเพลง \`${res.tracks[0].title}\` เรียบร้อยเเล้ว`)
				);
				if(!player.playing){
					player.play();
				}
			}
			break;
		}
		
	}
}
const pause = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else if(player.paused) return message.channel.send('⚠ | ตอนนี้กำลังหยุดชั่วคราวอยู่น่ะ');
	else{
		player.pause(true);
		message.channel.send(`:white_check_mark: ทำการหยุดชั่วคราวเรียบร้อยเเล้ว`);
	}
}
const resume = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else if(!player.paused) return message.channel.send('⚠ | ตอนนี้กำลังเล่นเพลงอยู่น่ะ');
	else{
		player.pause(false);
		message.channel.send(`:white_check_mark: ทำการเล่นเพลงต่อเรียบร้อยเเล้ว`);
	}
}
const skip = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		player.stop();
		message.channel.send(`:white_check_mark: ทำการข้ามเพลงเรียบร้อยเเล้ว`);
	}
}
const stop = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		player.destroy();
		message.channel.send(`:white_check_mark: ทำการปิดเพลงเรียบร้อยเเล้ว`);
	}
}
const nowplaying = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		let tracks = player.queue.current;
		message.channel.send(`**กำลังเล่น** \n\n\`${tracks.title}\``);
	}
}
const queue = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else if(!player.queue.size || player.queue.size === 0 || !player.queue || player.queue.length === 0) return message.channel.send('⚠ | คุณยังไม่มีคิวการเล่นน่ะ');
	else{
		let queueMsg = '**คิวเพลง**\n';
		for(let i = 0; i < player.queue.length; i++){
			queueMsg += `\`${i + 1})\` [${convertTime(player.queue[i].duration)}] - ${player.queue[i].title}`
		}
		message.channel.send(queueMsg); 
	}
}
const loop = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		if(!player.trackRepeat && !player.queueRepeat){
			player.setQueueRepeat(true);
			message.channel.send(`:white_check_mark: ทำการเปิดการวนซ้ำเเบบ \`ทั้งหมด\` เรียบร้อยเเล้ว`);
		}
		else if(player.queueRepeat && !player.trackRepeat){
			player.setTrackRepeat(true); 
			player.setQueueRepeat(false);
			message.channel.send(`:white_check_mark: ทำการเปิดการวนซ้ำเเบบ \`เพลงเดียว\` เรียบร้อยเเล้ว`);
		}
		else if(!player.queueRepeat && player.trackRepeat){
			player.setTrackRepeat(false);
			message.channel.send(`:white_check_mark: ทำการปิดการวนซ้ำเรียบร้อยเเล้ว`);
		}
	}
}
const volume = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		let new_volume = args[0];
		if(new_volume > 100) return message.channel.send(`⚠ | ไม่สามารถเพิ่มเสียงมากกว่า \`100\` ได้น่ะ`);
		else if(new_volume < 0) return message.channel.send('⚠ | ไม่สามารถลดเสียงน้อยกว่า \`0\` ได้น่ะ');
		else{
			player.setVolume(new_volume);
			message.channel.send(`:white_check_mark: ทำการตั้งค่าความดังเสียงเป็น \`${new_volume}\` เรียบร้อยเเล้ว`);
		}
	}
}
const shuffle = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else if(!player.queue.length || player.queue.length === 0 || !player.queue) return message.channel.send('⚠ | คุณยังไม่มีคิวการเล่นมากพอน่ะ');
	else{
		player.queue.shuffle();
		message.channel.send(`:white_check_mark: ทำการสุ่มเรียงคิวใหม่เรียบร้อยเเล้ว`);
	}
}
const connect = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(player || player.state == "CONNECTED") return message.channel.send('⚠ | ตอนนี้กำลังเชื่อมต่ออยู่น่ะ');
	else{
		player = manager.create({
			guild: message.guild.id,
			voiceChannel: message.member.voice.channel.id,
			textChannel: message.channel.id,
			selfDeafen: false,
			selfMute: false,
			volume: 80,
		});
		player.connect();
		message.channel.send(`:white_check_mark: เข้าช่อง ${channel.name} เเล้ว`);
	}
}
const radio = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else{
		if(!player){
			player = manager.create({
				guild: message.guild.id,
				voiceChannel: message.member.voice.channel.id,
				textChannel: message.channel.id,
				selfDeafen: false,
				selfMute: false,
				volume: 80,
			});
		}
		if(player.state !== 'CONNECTED') player.connect();
		playRadio(radioStation.ecq_18k);
	}
	async function playRadio(url){
		let res = await manager.search(url, message.author);
		switch(res.loadType){
			case "LOAD_FAILED":
			{
				if(!player.queue.current) player.destroy();
				await message.channel.send('⚠ | เกิดข้อผิดพลาด โปรดลองอีกครั้งในภายหลังน่ะ');
			}
			break;
			case "SEARCH_RESULT":
			{
				await player.queue.add(res.tracks[0]);
				message.channel.send(new MessageEmbed().setColor('YELLOW').setDescription(`:white_check_mark: | กำลังเล่นเพลง [จากสถานีวิทยุ 18k-Radio](https://ecq-studio.com/18K/X/)`));
				if(!player.playing){
					player.play();
				}
			}
			break;
			case "TRACK_LOADED":
			{
				await player.queue.add(res.tracks[0]);
				message.channel.send(new MessageEmbed().setColor('YELLOW').setDescription(`:white_check_mark: | กำลังเล่นเพลง [จากสถานีวิทยุ 18k-Radio](https://ecq-studio.com/18K/X/)`));
				if(!player.playing){
					player.play();
				}
			}
			break;
		}
	}
}
const clearQueue = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else if(!player.queue.length || player.queue.length === 0 || !player.queue) return message.channel.send('⚠ | คุณยังไม่มีคิวการเล่นมากพอน่ะ');
	else {
		player.queue.clear();
		message.channel.send(`:white_check_mark: ทำการล้างคิวเรียบร้อยเเล้ว`);
	}
}
const filter = async(client, message, args) =>{
	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	else if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	else if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	else{
		if(!args[0]) return message.channel.send('⚠ | ระบุฟิลเตอร์ที่ต้องการด้วยน่ะ');
		let filter;
		if(args[0].toLowerCase() === 'reset'){
			player.reset();
			message.channel.send(`:white_check_mark: | ทำการรีเซ็ตฟิลเตอร์เรียบร้อยเเล้ว`);
			return;
		}
		else if(args[0].toLowerCase() === 'nightcore'){
			player.nightcore = true;
			filter = 'NightCore';
		}
		else if(args[0].toLowerCase() === 'bassboost' || args[0].toLowerCase() === 'bb'){
			player.bassboost = true;
			filter = 'BassBoost';
		}
		else if(args[0].toLowerCase() === 'vaporwave'){
			player.bassboost = true;
			filter = 'Vaporwave';
		}
		else if(args[0].toLowerCase() === 'pop'){
			player.bassboost = true;
			filter = 'Pop';
		}
		else if(args[0].toLowerCase() === 'soft'){
			player.bassboost = true;
			filter = 'Soft';
		}
		else if(args[0].toLowerCase() === 'treblebass'){
			player.bassboost = true;
			filter = 'Treblebass';
		}
		else if(args[0].toLowerCase() === 'eightdimension'){
			player.bassboost = true;
			filter = 'Eight Dimension';
		}
		else if(args[0].toLowerCase() === 'karaoke'){
			player.bassboost = true;
			filter = 'Karaoke';
		}
		else if(args[0].toLowerCase() === 'vibrato'){
			player.bassboost = true;
			filter = 'Vibrato';
		}
		else if(args[0].toLowerCase() === 'tremolo'){
			player.bassboost = true;
			filter = 'Tremolo';
		}
		else{
			return message.channel.send('⚠ | อืมม...ดูเหมือนว่าจะไม่มีฟิลเตอร์นี้น่ะ');
		}
		message.channel.send(`:white_check_mark: | ทำการเพิ่มฟิลเตอร์ ${filter} เรียบร้อยเเล้ว`);
	}
}
const setup = async(client, message, args) =>{
	if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("**คุณไม่มีสิทธิพอน่ะ ต้องการยศ [ADMINISTRATOR] เพื่อใช้คำสั่งนี้้**");
	try{
		await message.guild.channels.create(`${client.user.username}-Music`,{
			type: `text`
		})
		.then(async (channel) => {
			await db.set(`music_${message.guild.id}_channel`,channel.id);
			const trackEmbed = new MessageEmbed()
                .setColor(config.Music.embed.default.color)
                .setTitle('ยังไม่มีเพลงเล่นอยู่ ณ ตอนนี้')
                .setImage(config.Music.embed.default.defaultimage)
                .setFooter(client.user.tag)
                .setTimestamp()
			let bpause = new MessageButton()
				.setID(`pause`)
				.setStyle(`SUCCESS`)
				.setEmoji(`⏯`)
			let bskip = new MessageButton()
				.setID(`skip`)
				.setStyle(`SECONDARY`)
				.setEmoji(`⏭`)
			let bstop = new MessageButton()
				.setID(`stop`)
				.setStyle(`red`)
				.setEmoji(`⏹`)
			let bloop = new MessageButton()
				.setID(`loop`)
				.setStyle(`SECONDARY`)
				.setEmoji(`🔁`)
			let bshuffle = new MessageButton()
				.setID(`shuffle`)
				.setStyle(`SUCCESS`)
				.setEmoji(`🔀`)
			let bvolumeup = new MessageButton()
				.setID(`volup`)
				.setLabel(`เพิ่มเสียง`)
				.setStyle(`PRIMARY`)
				.setEmoji(`🔊`)
			let bvolumedown = new MessageButton()
				.setID(`voldown`)
				.setLabel(`ลดเสียง`)
				.setStyle(`PRIMARY`)
				.setEmoji(`🔉`)
			let bmute = new MessageButton()
				.setID(`mute`)
				.setLabel(`ปิด/เปิดเสียง`)
				.setStyle(`PRIMARY`)
				.setEmoji(`🔈`)
			let row = new MessageActionRow()
				.addComponents(bpause,bskip,bstop,bloop,bshuffle)
			let row2 = new MessageActionRow()
				.addComponents(bvolumedown,bvolumeup,bmute)
			await channel.send(config.Music.embed.default.banner);
			await channel.send('**คิวเพลง:**\nเข้าช่องเสียง และพิมพ์ชื่อเพลงหรือลิงก์ของเพลง เพื่อเปิดเพลงน่ะ').then(async(msg) => await db.set(`music_${message.guild.id}_queue_message`, msg.id));
            await channel.send(trackEmbed,{components: [row, row2]}).then(async(msg) => await db.set(`music_${message.guild.id}_track_message`, msg.id));
            await message.channel.send(':white_check_mark: ทำการตั้งค่าระบบเพลงเรียบร้อยเเล้ว');
		});
	}
	catch(err){
		console.log(err);
	}
}
const Prefix = async(client, message, args) =>{
	if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("**คุณไม่มีสิทธิพอน่ะ ต้องการยศ [ADMINISTRATOR] เพื่อใช้คำสั่งนี้้**");
	if(!args[0]){
		let embed = new MessageEmbed()
			.setColor(embed_config.color)
			.setDescription(`prefix ตอนนี้คือ ${await get_prefix(message.guild.id)}`)
			.setThumbnail(message.guild.iconURL())
			.addField([
				{
					name: `🛠 | ตั้งค่า Prefix`,
					value: `\` ${await get_prefix(message.guild.id)}prefix  < prefix ที่ต้องการ > \``,
					inline: true,
				},
				{
					name: `♻ | รีเซ็ต Prefix`,
					value: `\` ${await get_prefix(message.guild.id)}prefix reset \``,
					inline: true,
				},
			])
			.setFooter(client.user.tag)
			.setTimestamp()
		await message.channel.send(embed);
	}
	else if(args[0]){
		if(args[0].toLowerCase() === 'reset'){
			const check_prefix = await db.get(`prefix_${message.guild.id}`);
			if(check_prefix == null){
				return message.channel.send('⚠ | เซิฟเวอร์นี้ยังไม่มีการตั้งค่า Prefix เลยน่ะ');
			}
			else {
				await db.delete(`prefix_${message.guild.id}`);
			}
		}
		else {
			if(args[1]){ 
				return message.channel.send("ไม่สามารถตั้งค่า**เเบบเว้นวรรค**ได้น่ะ");
			}
			if(args[0].length > 5){
				return message.channel.send('⚠ | ไม่สามารถตั้งค่า Prefix ที่ความยาวมากกว่า **5** ตัวอักษรน่ะ');
			}
			await db.set(`prefix_${message.guild.id}`).then(() =>{
				message.channel.send(`✅ ทำการตั้งค่า Prefix เป็น ${args[0]}`);
			});
		}
	}
}
const seek = async(client, message, args) =>{
	const durationPattern = /^[0-5]?[0-9](:[0-5][0-9]){1,2}$/;
	const duration = args[0];

	let channel = message.member.voice.channel;
	let player = manager.players.get(message.guild.id);
	if(!channel) return message.channel.send('⚠ | โปรดเข้าห้องเสียงก่อนใช้คำสั่งน่ะ');
	if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)) return message.channel.send('⚠ | ดูเหมือนว่าคุณจะไม่ได้อยู่ช่องเสียงเดียวกันน่ะ');
	if(!player || !player.queue.current) return message.channel.send('⚠ | ยังไม่มีการเล่นเพลง ณ ตอนนี้เลยน่ะ');
	if(!duration) return message.channel.send('⚠ | โปรดระบุเวลาที่ตต้องการจะข้ามด้วยน่ะ');
	if(!player.queue.current.isSeekable) return message.channel.send("⚠ | เพลงนี้ไม่สามารถข้ามได้น่ะ");
	if(!durationPattern.test(duration)) return message.channel.send("⚠ | โปรดระบุรูปเเบบเวลาให้ถูกต้องด้วยน่ะ");
	const durationMs = durationToMillis(duration);
	if(durationMs > player.queue.current.duration) return message.channel.send('⚠ | เวลาที่คุณระบุมาไม่ตรงกับความยาวของเพลงน่ะ');

	try {
		player.seek(durationMs);
		message.channel.send(`✅ | ทำการข้ามไปที่ ${convertTime(durationMs)} เรียบร้อยเเล้ว`);
	} 
	catch(e){
		msg.channel.send(`⚠ | เกิดข้อผิดพลาดขึ้นโปรดลองอีกครั้งในภายหลัง`);
	}
}

//========================= voice channel Event =========================
client.on('voiceStateUpdate', async(oldState, newState) =>{
	let player = await manager.players.get(newState.guild.id);
	if(player){
		if (oldState.channelID === null || typeof oldState.channelID == 'undefined') return;
		if (newState.id !== client.user.id) return;
		player.destroy();
		player.disconnect();
	}  
});
client.on('voiceStateUpdate', async(oldState, newState) =>{
	let player = await manager.players.get(newState.guild.id);
    if(player){
        const voiceChannel = newState.guild.channels.cache.get(player.voiceChannel);
        if(player.playing && voiceChannel.members.size < 2){
            player.destroy();
            player.disconnect();
        }
    } 
});

//=============================== Music Channel ===============================
const Music_Channel_Function = async(client, message, args) =>{
	message.delete({timeout: 1500});

	let channel = message.member.voice.channel;

	//import data 
	let musicChannelID = await db.get(`music_${message.guild.id}_channel`);
	let trackMessageID = await db.get(`music_${message.guild.id}_track_message`);
    let queueMessageID = await db.get(`music_${message.guild.id}_queue_message`);
	//check data is valid
	let musicChannel = await message.guild.channels.cache.get(musicChannelID);
	let trackMessage = await musicChannel.messages.fetch(trackMessageID);
    let queueMessage = await musicChannel.messages.fetch(queueMessageID);
	if(!musicChannel) return; //if invalid will return
    if(!trackMessage) return; //
	if(!queueMessage) return; //


	if(!channel){  
        message.channel.send(':warning: โปรดเข้าช่องเสียงก่อนเปิดเพลงน่ะ').then((msg) =>{
            msg.delete({timeout: 5000 });
        });
        return;
    }
	if(message.guild.me.voice.channel && !channel.equals(message.guild.me.voice.channel)){
        message.channel.send(':warning: เอ๊ะ! ดูเหมือนว่าคุณจะไม่ได้อยู่ในช่องเสียงเดียวกันน่ะ').then((msg) =>{
            msg.delete({timeout: 5000 });
        });
        return;
    }

	let queary = message.content;
    let player = await manager.players.get(message.guild.id);

	if(!player){
        player = await manager.create({
            guild : message.guild.id,
            textChannel : message.channel.id, 
            selfDeafen : false,
            selfMute : false,
            voiceChannel : channel.id,
            volume : 80,
        });
    }
	if(player.state !== "CONNECTED") await player.connect();
    let res = await manager.search(queary, message.author);

	switch (res.loadType) {
        case "LOAD_FAILED": 
        {
            if(player.queue.current) await player.destroy();
            message.channel.send(`:x: ไม่สามารถโหลดการค้นหาได้ โปรดลองอีกครั้งในภายหลังน่ะ`).then((msg) =>{
                msg.delete({timeout: 5000 });
            });
        }
            break;
        case "NO_MATCHES": 
        {
            if(player.queue.current) await player.destroy();
            message.channel.send(`:x: ไม่พบผลการค้นหาของ ${queary} `).then((msg) =>{
                msg.delete({timeout: 5000 });
            });
        }
            break;
        case "PLAYLIST_LOADED": 
        {
            await player.queue.add(res.tracks);
            message.channel.send(`:white_check_mark: ทำการเพิ่ม Playlist : ${res.playlist.name}  เข้าไปในคิวการเล่นเเล้ว`).then((msg) =>{
                msg.delete({timeout: 5000 });
            });
            if(!player.playing){
                await player.play();
            }
			queueMessage.edit(queue_msg(client, player));
        }

            break;
        case "SEARCH_RESULT": 
        {
            await player.queue.add(res.tracks[0]);
            message.channel.send(`:white_check_mark: ได้ทำการเพิ่มเพลง : ${res.tracks[0].title}  เข้าไปในคิวการเล่นเเล้ว`).then((msg) =>{
                msg.delete({timeout: 5000 });
            });
            if(!player.playing){
                await player.play();
            }
			queueMessage.edit(queue_msg(client, player));
        }
            break;
            case "TRACK_LOADED": 
        {
            await player.queue.add(res.tracks[0]);
            message.channel.send(`:white_check_mark: ได้ทำการเพิ่มเพลง : ${res.tracks[0].title}  เข้าไปในคิวการเล่นเเล้ว`).then((msg) =>{
                msg.delete({timeout: 5000 });
            });
            if(!player.playing){
                await player.play(); 
            }
            queueMessage.edit(queue_msg(client, player));
        }
            break;
        default:
            break;
    }
}

//========================= buttton Collector Event ======================
client.on('clickButton', async (b) =>{
	await b.reply.defer();
	let musicChannelID = await db.get(`music_${b.guild.id}_channel`);
	let trackEmbedID = await db.get(`music_${b.guild.id}_track_message`);
	let queueMessageID = await db.get(`music_${b.guild.id}_queue_message`);

	let musicChannel = await client.channels.cache.get(musicChannelID);
	if(!musicChannel) return;
	let trackEmbed = await musicChannel.messages.fetch(trackEmbedID);
	let queueMessage = await musicChannel.messages.fetch(queueMessageID);

	let player = await manager.players.get(b.guild.id);
	if(player){
		// check if clicker user is not in same channel
		let GetUser = b.guild.members.cache.find(user => user.id === b.clicker.user.id);
		if(!GetUser) return; // if user not found
		let Clicker_Vc = GetUser.voice.channel;
		if(!Clicker_Vc) return; // if voice channel not found
		if(b.guild.me.voice.channel && !Clicker_Vc.equals(b.guild.me.voice.channel)) return await GetUser.send(new MessageEmbed().setTitle('💢 ตอนนี้มีคนกำลังใช้งานอยู่น่ะ ลองเข้าช่องเดียวกันเพื่อเปิดเพลงสิ').setColor(embed_config.color).setFooter(client.user.tag).setTimestamp()).then(async(msg) =>{
			await msg.react('🚫').catch(err => console.log(err));
			await msg.delete({timeout: 15000});
		});
		// check button id
		if(b.id == 'pause'){
			if(!player.paused){
				player.pause(true);
				await musicChannel.send(':white_check_mark: ทำการหยุดเพลงชั่วคราวเรียบร้อยเเล้ว').then(async(msg) => await msg.delete({timeout: 5000}));
			}
			if(player.paused){
				player.pause(false);
				await musicChannel.send(':white_check_mark: ทำการเล่นเพลงต่อเเล้ว').then(async(msg) => await msg.delete({timeout: 5000}));
			}
		}
		else if(b.id == 'skip'){
			player.stop();
			await musicChannel.send(':white_check_mark: ทำการข้ามเพลงให้เรียบร้อยเเล้ว').then(async(msg) => await msg.delete({timeout: 5000}));
		}
		else if(b.id == 'stop'){
			if(player.playing){
				player.destroy();
				await musicChannel.send(':white_check_mark: ทำการปิดเพลงเรียบร้อยเเล้ว').then(async(msg) => await msg.delete({timeout: 5000}));
			}
		}
		else if(b.id == 'loop'){
			if(!player.trackRepeat && !player.queueRepeat){
				player.setTrackRepeat(false)
				player.setQueueRepeat(true);
				await musicChannel.send(`:white_check_mark: ทำการเปิดการวนซ้ำเพลงเเบบ \`ทั้งหมด\` เรียบร้อยเเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
				await trackEmbed.edit(track_msg_Embed_loop(client, player, "queue"));
			}
			else if(player.queueRepeat && !player.trackRepeat){
				player.setQueueRepeat(false);
				player.setTrackRepeat(true);
				await musicChannel.send(`:white_check_mark: ทำการเปิดการวนซ้ำเพลงเเบบ \`เพลงเดียว\` เรียบร้อยเเล้ว`).then(async(msg) =>{
					await trackEmbed.edit(track_msg_Embed_loop(client, player, "track"));
					await msg.delete({timeout: 5000});
				});
			}
			else if(!player.queueRepeat && player.trackRepeat){
				player.setQueueRepeat(false);
				player.setTrackRepeat(false);
				await musicChannel.send(`:white_check_mark: ทำการปิดวนซ้ำเพลงเรียบร้อยเเล้ว`).then(async(msg) =>{
					await trackEmbed.edit(track_msg_Embed_loop(client, player, "stop"));
					await msg.delete({timeout: 5000});
				});
			}
		}
		else if(b.id == 'shuffle'){
			if(!player.queue || !player.queue.length || player.queue.length == 0){
				await musicChannel.send(':warning: เอ๊ะ! ดูเหมือนว่าคิวของคุณจะไม่มีความยาวมากพอน่ะ').then(async(msg) => await msg.delete({timeout: 5000}));
			}
			else{
				await player.queue.shuffle();
				await musicChannel.send(':white_check_mark: ทำการสุ่มเรียงรายการคิวใหม่เรียบร้อยเเล้ว').then(async(msg) =>{
					await queueMessage.edit(queue_msg(client, player));
					await msg.delete({timeout: 5000});
				});
			}
		}
		else if(b.id == 'voldown'){
			let newVol = player.volume - 10;
			if(newVol > 0){
				player.setVolume(newVol);
				await musicChannel.send(`:white_check_mark: ทำการปรับความดังเสียงเป็น \`${newVol}\` เรียบร้อยเเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}   
			else if(newVol < 0){
				await musicChannel.send(`:white_check_mark: ไม่สามารถปรับความดังเสียงได้น้อยกว่านี้เเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}
		}
		else if(b.id == 'volup'){
			let newVol = player.volume + 10;
			if(newVol < 110){
				player.setVolume(newVol);
				await musicChannel.send(`:white_check_mark: ทำการปรับความดังเสียงเป็น \`${newVol}\` เรียบร้อยเเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}
			else if(newVol >= 110){
				await musicChannel.send(`:white_check_mark: ไม่สามารถปรับความดังเสียงได้มากกว่านี้เเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}
		}
		else if(b.id == 'mute'){
			if(player.volume > 0){
				player.setVolume(0);
				await musicChannel.send(`:white_check_mark: ทำการปิดเสียงเรียบร้อยเเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}
			else if(player.volume == 0){
				player.setVolume(player.options.volume);
				await musicChannel.send(`:white_check_mark: ทำการเปิดเสียงเรียบร้อยเเล้ว`).then(async(msg) => await msg.delete({timeout: 5000}));
			}
		}
	}
});
client.on('clickMenu', async (b) =>{
	if(b.values[0] == "ssss") {

	}
	await b.reply.defer();
});

//========================= Error Handler(Anti Error) ========================= 

process.on('unhandledRejection', async(reason, p) =>{
    console.log(chalk.bold.redBright("[Anti-crash] ") + chalk.bold.white("Unhandled Rejection/Catch"));
    console.log(reason, p);
});
process.on('uncaughtException', async(err, origin) =>{
    console.log(chalk.bold.redBright("[Anti-crash] ") + chalk.bold.white("Uncaught Exception/Catch"));
    console.log(err, origin);
});
process.on('uncaughtExceptionMonitor', async(err, origin) =>{
    console.log(chalk.bold.redBright("[Anti-crash] ") + chalk.bold.white("Uncaught Exception/Catch (MONITOR)"));
    console.log(err, origin);   
});

//========================= Login To Bot ========================= 
client.login(token);

//=========================== Utils ============================================

function convertTime(duration){
	var milliseconds = parseInt((duration % 1000) / 100);
	var	seconds = parseInt((duration / 1000) % 60);
	var	minutes = parseInt((duration / (1000 * 60)) % 60);
	var hours = parseInt((duration / (1000 * 60 *60)) % 24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	if (duration < 3600000) {
	  return minutes + ":" + seconds;
	} else {
	  return hours + ":" + minutes + ":" + seconds;
	}
}
function durationToMillis(dur){
	return dur.split(":").map(Number).reduce((acc, curr) => curr + acc * 60) * 1000;
}
function track_msg_Embed(client, player){
	const embed = new MessageEmbed()
		.setColor(config.Music.embed.default.color)
		.setTitle(player.queue.current.title)
		.setURL(player.queue.current.uri)
		.setImage(youtubeThumbnail(player.queue.current.uri, 'high'))
		.setFooter(player.queue.current.requester.username)
		.setTimestamp()
	return embed;
}
function track_msg_Embed_loop(client, player, loop){
	let embed;
	if(loop.toLowerCase() === "queue"){
		embed = new MessageEmbed()
			.setColor(config.Music.embed.default.color)
			.setTitle(player.queue.current.title)
			.setURL(player.queue.current.uri)
			.setImage(youtubeThumbnail(player.queue.current.uri, 'high'))
			.setFooter(`${player.queue.current.requester.username}  |  Loop : ทั้งหมด`)
	}
	else if(loop.toLowerCase() === "track"){
		embed = new MessageEmbed()
			.setColor(config.Music.embed.default.color)
			.setTitle(player.queue.current.title)
			.setURL(player.queue.current.uri)
			.setImage(youtubeThumbnail(player.queue.current.uri, 'high'))
			.setFooter(`${player.queue.current.requester.username}  |  Loop : เพลงเดียว`)
	}
	else if(loop.toLowerCase() === "stop"){
		embed = new MessageEmbed()
			.setColor(config.Music.embed.default.color)
			.setTitle(player.queue.current.title)
			.setURL(player.queue.current.uri)
			.setImage(youtubeThumbnail(player.queue.current.uri, 'high'))
			.setFooter(`${player.queue.current.requester.username}`)
			.setTimestamp()
	}
	return embed;
}
function queue_msg(client, player){ // fix bug
	let Queue_message = `**คิวเพลง: [${player.queue.length}]**\n`;
	let return_Queue_message;
	let i;
        for(i = 0; i < player.queue.length; i++) {
            Queue_message += `> \`${i + 1})\` [${convertTime(player.queue[i].duration)}] - ${player.queue[i].title}\n`;
			if(Queue_message.length >= 2000){
				break;
			}
			return_Queue_message = Queue_message;
        }
	if(return_Queue_message == undefined || !return_Queue_message){
		return return_Queue_message = Queue_message + "ยังไม่รายการคิว";
	}
	else{
		return return_Queue_message;
	}
}
function youtubeThumbnail(url, quality){
	if(url){
		var video_id, thumbnail, result;
		if(result = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/)){
			video_id = result.pop();
		}
		else if(result = url.match(/youtu.be\/(.{11})/)){
			video_id = result.pop();
		}

		if(video_id){
			if(typeof quality == "undefined"){
				quality = 'high';
			}
		
			var quality_key = 'maxresdefault'; // Max quality
			if(quality == 'low'){
				quality_key = 'sddefault';
			}else if(quality == 'medium'){
				quality_key = 'mqdefault';
			} else if (quality == 'high') {
				quality_key = 'hqdefault';
			}

			var thumbnail = "http://img.youtube.com/vi/"+video_id+"/"+quality_key+".jpg";
			return thumbnail;
		}
	}
}
async function get_prefix(guild_id){
	let PREFIX;
    try {
        let fetched = await db.get(`prefix_${guild_id}`);
        if (fetched == null) {
            PREFIX = prefix;
        }
        else {
            PREFIX = fetched;
        }
		return PREFIX;
    } 
    catch (e) {
        console.log(e);
    };
}
