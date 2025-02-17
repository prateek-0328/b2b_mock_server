import axios from "axios";
import { SubscriberDetail } from "../../interfaces";
import { prisma } from "./prisma";
import { REGISTRY_URL } from "./constants";
import { Prisma } from "@prisma/client";

export async function getSubscriberDetails(
	subscriber_id: string,
	unique_key_id: string
) {
	var subscribers = await prisma.user.findMany({
		where: {
			subscriber_id,
			unique_key_id,
		},
		select: {
			subscriber_id: true,
			unique_key_id: true,
			signing_public_key: true,
			valid_until: true,
			type: true,
		},
	});

	console.log(
		"Registry Lookup Paramters",
		JSON.stringify({
			subscriber_id,
			unique_key_id,
		})
	);
	if (subscribers.length === 0) {
		const response = await axios.post(REGISTRY_URL, {
			subscriber_id,
			unique_key_id,
		});
		response.data
			.map((data: object) => {
				const {subscriber_url, ...subscriberData} = data as SubscriberDetail;
        return {
          ...subscriberData,
          unique_key_id: subscriber_url
        }
			})
			.forEach((data: object) => {
				try {
					subscribers.push(data as Prisma.UserCreateInput);
				} catch (error) {
					console.log(error);
				}
			});
		await prisma.user.createMany({
			data: subscribers,
		});
	}

	return subscribers![0];
}
