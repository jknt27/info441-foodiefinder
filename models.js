import mongoose from 'mongoose';
import 'dotenv/config';

let models = {};

main().catch(err => console.log(err))
async function main() {
	console.log('Connecting to MongoDB');
	await mongoose.connect(`mongodb+srv://info441auteam7:${process.env.MONGO_PW}@foodiefinder.xmck3sp.mongodb.net/data`);
	console.log('Succesffully connected to MongoDB!');

	const restaurantsSchema = new mongoose.Schema({
		restaurant_id: String,
		name: String,
		image: String,
		phoneNum: String,
		location: Object,
		coordinates: Object,
		cuisine: [String],
		orderType: [String],
		ratings: [Number],
		price: String,
		hours: Object,
		favoriteUsers: [String],
	});

	const usersSchema = new mongoose.Schema({
		name: String,
		username: String,
		zipCode: { type: Number, default: 98105 },
		favorite_cuisine: String,
		favorite_dish: String,
		favorite_restaurant: String,
		allergies: String,
		diet: String,
		SavedRestaurant: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
		friends: { type: [String], default: [] },
		ratings: {type: [Number], default: []},
	});

	const reviewsSchema = new mongoose.Schema({
		restaurant_name: String,
		restaurant_id: String,
		reviewer_id: String,
		reviewer_post: String,
		reviewer_rating: Number,
		would_recommend: Boolean,
		created_date: {type: Date, default: Date.now},
	});

	const FriendsProcessSchema = new mongoose.Schema({
		SenderName: String,
		receiverName: String,
		Status: String
	});

	const messageProcessSchema = new mongoose.Schema({
		senderName: String,
		receiverName: String,
		message: String,
		date: Date
	});

	models.Restaurant = mongoose.model('Restaurant', restaurantsSchema);
	models.UserInfo = mongoose.model("UserInfo", usersSchema);
	models.Reviews = mongoose.model("Reviews", reviewsSchema);
	models.messageProcess = mongoose.model("messageProcess", messageProcessSchema);
	models.friendprocesses = mongoose.model("friendProcess", FriendsProcessSchema);

	console.log('mongoose models created');
}

export default models;
