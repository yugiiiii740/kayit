require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const usersFile = './users.json';
let users = {};

if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
}

// Slash komutları tanımı
const commands = [
  new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Kayıt ol - steam profil, isim, yaş, nick')
    .addStringOption(option => option.setName('steamprofil').setDescription('Steam profil link veya isim').setRequired(true))
    .addStringOption(option => option.setName('isim').setDescription('İsminiz').setRequired(true))
    .addIntegerOption(option => option.setName('yas').setDescription('Yaşınız').setRequired(true))
    .addStringOption(option => option.setName('nick').setDescription('Nickiniz').setRequired(true)),

  new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Kayıtlı profilini göster')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Komutları sunucuya kaydet
async function registerCommands() {
  try {
    console.log('Slash komutları yükleniyor...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Komutlar yüklendi!');
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
  registerCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'kayıt') {
    const steamProfil = interaction.options.getString('steamprofil');
    const isim = interaction.options.getString('isim');
    const yas = interaction.options.getInteger('yas');
    const nick = interaction.options.getString('nick');

    if (yas < 5 || yas > 120) {
      return interaction.reply({ content: 'Lütfen geçerli bir yaş girin (5-120).', ephemeral: true });
    }

    users[interaction.user.id] = { steamProfil, isim, yas, nick };
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    return interaction.reply({ content: 'Kayıt başarıyla tamamlandı!', ephemeral: true });
  }

  if (interaction.commandName === 'profil') {
    const userData = users[interaction.user.id];
    if (!userData) {
      return interaction.reply({ content: 'Kayıt bulunamadı. Önce /kayıt ile kayıt ol.', ephemeral: true });
    }

    return interaction.reply({
      content: `Profilin:\nSteam Profil: ${userData.steamProfil}\nİsim: ${userData.isim}\nYaş: ${userData.yas}\nNick: ${userData.nick}`,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
