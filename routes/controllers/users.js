import express, { json } from 'express';
import models from '../../models.js';
var router = express.Router();

router.get('/friendsRec', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const username = req.session.account.username;
			const currentUser = await models.UserInfo.findOne({ username: username });
			if (!currentUser) {
				return res.status(404).json({ error: 'User not found' });
			}
			const matchingUsers = await models.UserInfo.find({
				$and: [
					{
						$or: [
							{ favorite_cuisine: currentUser.favorite_cuisine },
							{ zipCode: currentUser.zipCode }
						]
					},
					{ username: { $nin: [...currentUser.friends, currentUser.username] } }
				]
			}).limit(5).exec();
			res.json(matchingUsers);
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

router.get('/friendsSendAccpet', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const sender = req.session.account.username;
			const receiver = req.query.ReceverName;
			const friendRequest = await models.friendprocesses.findOne({
				$or: [
					{ SenderName: sender, receiverName: receiver, Status: 'pending' },
					{ SenderName: receiver, receiverName: sender, Status: 'pending' },
				]
			});
			if (!friendRequest) {
				const FriendsProcessSchema = new models.friendprocesses({
					SenderName: sender,
					receiverName: receiver,
					Status: 'pending',
				});
				await FriendsProcessSchema.save();
			} else {
				return res.json({ status: 'Error', message: 'Already Send Invitation' });
			}
			return res.json({ status: 'success', message: 'Send Friend' });
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

router.get('/friendsUnSendAccpet', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const sender = req.session.account.username;
			const receiver = req.query.ReceverName;
			const friendRequest = await models.friendprocesses.findOne({
				SenderName: sender, receiverName: receiver
			});
			if (friendRequest) {
				await models.friendprocesses.deleteOne({
					SenderName: sender, receiverName: receiver
				});
				return res.json({ status: 'Success', message: 'unsend inviite' });
			} else {
				return res.json({ status: 'Error', message: 'has not invite' });
			}
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

router.get('/request', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const username = req.session.account.username;
			const sender = await models.friendprocesses.find({ receiverName: username, Status: 'pending' }).select('SenderName -_id').exec();
			const senderNames = sender.map(obj => obj['SenderName']);
			const senderNameInfo = await models.UserInfo.find({
				username: { $in: senderNames }
			});
			res.json(senderNameInfo);
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
	if (!req.session.isAuthenticated) {
		return res.redirect('/auth/signin'); // redirect to sign-in route
	}
	next();
};

router.get('/myIdentity', (req, res) => {
	if (req.session.isAuthenticated) {
		const userAccount = req.session.account
		res.json({
			status: 'loggedin',
			userInfo: {
				name: userAccount.name,
				username: userAccount.username
			}
		})
	} else {
		res.json({ status: 'loggedout' })
	}
})

router.get('/friendAccpet', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const currentUser = req.session.account.username;
			const sender = req.query.ReceverName;
			const friendRequest = await models.friendprocesses.findOne({
				SenderName: sender, receiverName: currentUser
			});
			const currentUserINFO = await models.UserInfo.findOne({
				username: currentUser
			});
			const senderINFO = await models.UserInfo.findOne({
				username: sender
			});
			if (friendRequest) {
				friendRequest.Status = 'Friend';
				currentUserINFO.friends.push(sender);
				senderINFO.friends.push(currentUser);
				await currentUserINFO.save();
				await senderINFO.save();

				// Remove the friend request after accepting
				await friendRequest.save();
			} else {
				return res.json({ status: 'Error', message: 'Invitation Not existed' });
			}
			return res.json({ status: 'success', message: 'Friend' });
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}

});

router.get('/pending', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const currentUser = req.session.account.username;
			const currentUserINFO = await models.friendprocesses.find({
				SenderName: currentUser,
				Status: "pending"
			});
			res.json(currentUserINFO);
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}

});

router.get('/friend', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const currentUser = req.session.account.username;
			const currentUserINFO = await models.UserInfo.findOne({
				username: currentUser
			});
			const friendList = await models.UserInfo.find({
				username: { $in: currentUserINFO.friends }
			});
			res.json(friendList);
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}

});

router.get('/unfriend', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const currentUser = req.session.account.username;
			const friendName = req.query.ReceverName;
			const friendRequest = await models.friendprocesses.findOne({
				$or: [
					{ SenderName: currentUser, receiverName: friendName },
					{ SenderName: friendName, receiverName: currentUser },
				]

			});
			const currentUserINFO = await models.UserInfo.findOne({
				username: currentUser
			});
			const friendNameInfo = await models.UserInfo.findOne({
				username: friendName
			});

			if (friendRequest) {
				const CurrentUserfriendIndex = currentUserINFO.friends.indexOf(friendName);
				const FriendUserfriendIndex = friendNameInfo.friends.indexOf(currentUser);
				currentUserINFO.friends.splice(CurrentUserfriendIndex, 1);
				friendNameInfo.friends.splice(FriendUserfriendIndex, 1);
				await currentUserINFO.save();
				await friendNameInfo.save();
				const result = await models.friendprocesses.deleteOne({ _id: friendRequest._id });
			} else {
				return res.json({ status: 'Error', message: 'Invitation Not existed' });
			}
			return res.json({ status: 'success', message: 'UnFriend' });
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

router.get('/getmessage', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {

			const currentUser = req.session.account.username;
			const firend = req.query.ReceverName;
			const allMessage = await models.messageProcess.find({
				$or: [
					{ senderName: currentUser, receiverName: firend },
					{ senderName: firend, receiverName: currentUser },
				]
			}).sort({ date: 1 });
			res.json(allMessage);
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}

});
router.post('/message', async (req, res) => {
	try {
		if (req.session.isAuthenticated) {
			const information = req.body;
			const senderName = information.senderName;
			const receiverName = information.receiverName;
			const message = information.message;
			const date = information.date;

			const privateMessage = new models.messageProcess({
				senderName: senderName,
				receiverName: receiverName,
				message: message,
				date: date,
			});
			await privateMessage.save();
			res.json({ "status": "success" });
		} else {
			res.status(401).json({ "status": "error", "error": "not logged in" });
		}
	} catch (error) {
		res.status(500).json({ "status": "error", "error": error });
	}
});

export default router;
