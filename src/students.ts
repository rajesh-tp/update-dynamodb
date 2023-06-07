import AWS, { DynamoDB } from "aws-sdk";

// Please change "your_aws_profile" with your profile
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: "your_aws_profile" });
AWS.config.update({ region: "eu-west-1" });

interface StudentDataModel {
	id: string;
	name: string;
	class: string;
	marks: number;
}

class DynamoDBService {
	private docClient: DynamoDB.DocumentClient;
	private tableName: string;

	constructor(tableName: string) {
		this.docClient = new AWS.DynamoDB.DocumentClient();
		this.tableName = tableName;
	}

	public async saveBatch(items: Array<StudentDataModel>): Promise<void> {
		const MAX_RETRIES = 1;
		const RETRY_WAIT_TIME_MS = 1000;

		const unprocessedItems: Array<StudentDataModel> = [...items];
		let retries = 0;

		while (unprocessedItems.length > 0 && retries <= MAX_RETRIES) {
			const batch = this.createParams(unprocessedItems);
			const response = await this.docClient.batchWrite(batch).promise();

			if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
				const unprocessedItemsBatch = Object.values(response.UnprocessedItems).reduce(
					(acc, arr) => [...acc, ...arr],
					[]
				) as Array<StudentDataModel>;
				unprocessedItems.splice(0, unprocessedItems.length, ...unprocessedItemsBatch);
				retries++;
				console.log(unprocessedItems);
				await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_TIME_MS));
			} else {
				console.log("All items successfully written to the table.");
				return;
			}
		}

		if (unprocessedItems.length > 0) {
			console.log("Max retry attempts reached. Some items could not be processed:", unprocessedItems);
		}
	}

	private createParams(items: Array<StudentDataModel>): DynamoDB.DocumentClient.BatchWriteItemInput {
		const putRequests = items.map((item) => ({
			PutRequest: {
				Item: {
					id: item.id,
					name: item.name,
					class: item.class,
					marks: item.marks
				}
			}
		}));

		return {
			RequestItems: {
				[this.tableName]: putRequests
			}
		};
	}
}

// Usage example
const dynamoDBService = new DynamoDBService("Student");

const students: Array<StudentDataModel> = [
	{ id: "1", name: "John Doe", class: "10A", marks: 95 },
	{ id: "2", name: "Jane Smith", class: "9B", marks: 88 },
	{ id: "3", name: "Michael Johnson", class: "11C", marks: 92 },
	{ id: "4", name: "Rajesh T P", class: "12D", marks: 96 },
	{ id: "5", name: "Suresh Kumar", class: "12A", marks: 100 },
	{ id: "6", name: "Lakshmipriya", class: "10A", marks: 97 },
	{ id: "7", name: "Lekshmy", class: "9B", marks: 88 },
	{ id: "8", name: "Sreeja Krishnan", class: "11C", marks: 91 },
	{ id: "9", name: "Zen Mohan", class: "12D", marks: 86 },
	{ id: "10", name: "Rahim", class: "12A", marks: 80 },
	{ id: "11", name: "ABC1", class: "10A", marks: 95 },
	{ id: "12", name: "ABC2", class: "9B", marks: 88 },
	{ id: "13", name: "ABC3", class: "11C", marks: 92 },
	{ id: "14", name: "ABC4", class: "12D", marks: 96 },
	{ id: "15", name: "ABC5", class: "12A", marks: 100 },
	{ id: "16", name: "ABC6", class: "10A", marks: 97 },
	{ id: "17", name: "ABC7", class: "9B", marks: 88 },
	{ id: "18", name: "ABC8", class: "11C", marks: 91 },
	{ id: "19", name: "ABC9", class: "12D", marks: 86 },
	{ id: "20", name: "ABC10", class: "12A", marks: 80 },
	{ id: "21", name: "ABC11", class: "10A", marks: 95 },
	{ id: "22", name: "ABC12", class: "9B", marks: 88 },
	{ id: "23", name: "ABC13", class: "11C", marks: 92 },
	{ id: "24", name: "ABC14", class: "12D", marks: 96 },
	{ id: "25", name: "ABC15", class: "12A", marks: 100 }
	// ... add more student items
];

dynamoDBService
	.saveBatch(students)
	.then(() => {
		console.log("Batch write completed successfully.");
	})
	.catch((error) => {
		console.error("Error during batch write:", error);
	});
