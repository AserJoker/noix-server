const insertOne = () => {
  fetch("/permission", {
    method: "POST",
    body: JSON.stringify({
      character: {
        insertOne: [
          {
            condition: {
              permission: "*",
              user: [
                {
                  name: "admin",
                },
              ],
            },
          },
          {
            permission: "string",
            user: {
              userPermission: "string",
              id: "string",
            },
          },
        ],
      },
      user: {
        queryPage: [
          {
            condition: { name: "admin" },
            offset: 0,
            size: 1,
          },
          {
            name: "string",
            id: "string",
          },
        ],
      },
    }),
  });
};
insertOne();
