import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CollaboratorSchema = new Schema({
	id: { type: String, required: true },
	name: { type: String, required: true },
	email: { type: String, required: true },
	role: { type: String, required: true, default: 'Editor' }
}, { _id: false });

const WalletSchema = new Schema({
	userId: { type: String, required: true, index: true },
	name: { type: String, required: true },
	balance: { type: String, required: true },
	currency: { type: String, required: true, default: 'PHP' },
	type: { type: String, required: true, enum: ['Personal', 'Shared'], default: 'Personal' },
	description: { type: String, default: '' },
	collaborators: { type: [CollaboratorSchema], default: [] },

	// Customization fields
	walletType: { type: String, default: 'Cash' },
	plan: { type: String, enum: ['Personal', 'Shared'], default: 'Personal' },
	backgroundColor: { type: String, default: '#e2e8f0' },
	textColor: { type: String, default: '#1a1a1a' },
	color1: { type: String, default: '#e2e8f0' },
	color2: { type: String, default: '#e2e8f0' },
	template: { type: String, default: 'Default' }
}, { timestamps: true });

const Wallet = model('Wallet', WalletSchema);

export default Wallet;
