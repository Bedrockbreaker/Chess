using System;
using Godot;

public class Instance {

	public static readonly int id = 0;
	public static readonly string UUID;

	static Instance() {
		TcpServer tcp = new();
		while(tcp.Listen((ushort)(11000 + id++)) == Error.AlreadyInUse) {}

		// Generate a seeded UUIDv4
		Random random = new(id);
		byte[] buffer = new byte[16];
		random.NextBytes(buffer);
		buffer[7] = (byte)((buffer[7] & 0x0f) | 0x40);
		buffer[8] = (byte)((buffer[8] & 0x3f) | 0x80);
		UUID = new Guid(buffer).ToString();
	}
}
