import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Provider, Signer, Transaction, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as modAbi from "../build/modallowance-abi.json";
import * as accountAbi from "@veive-io/account-as/dist/account-abi.json";
import * as dotenv from "dotenv";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const account1Sign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const account2Sign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modAllowance = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modValidation = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const tokenSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const account1Contract = new Contract({
  id: account1Sign.getAddress(),
  abi: accountAbi,
  provider,
}).functions;

const modContract = new Contract({
  id: modAllowance.getAddress(),
  abi: modAbi,
  provider,
}).functions;

const modSerializer = new Contract({
  id: modAllowance.getAddress(),
  abi: modAbi,
  provider
}).serializer;

const tokenContract = new Contract({
  id: tokenSign.getAddress(),
  abi: utils.tokenAbi,
  provider,
}).functions;

beforeAll(async () => {
  // start local-koinos node
  await localKoinos.startNode();
  await localKoinos.startBlockProduction();

  // deploy smart-account
  await localKoinos.deployContract(
    account1Sign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive-io/account-as/dist/release/Account.wasm"),
    accountAbi,
    {},
    {
      authorizesCallContract: true,
      authorizesTransactionApplication: true,
      authorizesUploadContract: true,
    }
  );

  // deploy mod contract
  await localKoinos.deployContract(
    modAllowance.getPrivateKey("wif"),
    path.join(__dirname, "../build/release/ModAllowance.wasm"),
    modAbi
  );

  // deploy mod contract
  await localKoinos.deployContract(
    modValidation.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive-io/mod-validation-as/dist/release/ModValidation.wasm"),
    modAbi
  );

  // deploy token account
  await localKoinos.deployContract(
    tokenSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@koinosbox/contracts/assembly/token/release/token.wasm"),
    utils.tokenAbi
  );

  // mint some tokens to user
  const tx2 = new Transaction({
    signer: tokenSign,
    provider,
  });
  await tx2.pushOperation(tokenContract["mint"], {
    to: account1Sign.address,
    value: "100",
  });

  await tx2.send();
  await tx2.wait();
});

afterAll(() => {
  // stop local-koinos node
  localKoinos.stopNode();
});

it("install module validation in scopes contract_upload, transaction_application", async () => {
  const scope1 = await modSerializer.serialize({operation_type: 'contract_upload'}, "scope");
  const scope2 = await modSerializer.serialize({operation_type: 'transaction_application'}, "scope");

  // install validator
  const { operation: install_module } = await account1Contract["install_module"]({
    module_type_id: 1,
    contract_id: modValidation.address,
    scopes: [
      utils.encodeBase64url(scope1),
      utils.encodeBase64url(scope2)
    ]
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider
  });

  const { operation: exec } = await account1Contract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();

  const { result } = await account1Contract["get_modules"]();
  expect(result.value[0]).toStrictEqual(modValidation.address);
});


it("install module allowance in scope contract_call", async () => {
  const scope = await modSerializer.serialize({operation_type: 'contract_call'}, "scope");

  // install validator
  const { operation: install_module } = await account1Contract["install_module"]({
    module_type_id: 1,
    contract_id: modAllowance.address,
    scopes: [
      utils.encodeBase64url(scope)
    ]
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider
  });

  const { operation: exec } = await account1Contract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain("[mod-allowance] called on_install");

  const { result } = await account1Contract["get_modules"]();
  expect(result.value[0]).toStrictEqual(modAllowance.address);
});

it("account1 tries a transfer with unlegit allowance", async () => {
  // prepare fake transfer operation
  const { operation: fakeTransfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // allow operation
  const { operation: allow } = await modContract['allow']({
    user: account1Sign.address,
    operation: {
      contract_id: fakeTransfer.call_contract.contract_id,
      entry_point: fakeTransfer.call_contract.entry_point,
      args: fakeTransfer.call_contract.args
    }
  }, { onlyOperation: true });

  // prepare real transfer operation
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "100",
  }, { onlyOperation: true })

  // send operations
  const tx = new Transaction({
    signer: account1Sign,
    provider
  });
  await tx.pushOperation(allow);
  await tx.pushOperation(transfer);

  let error = undefined;
  try {
    await tx.send();
  } catch (e) {
    error = e;
  }

  // expect fail check
  expect(JSON.parse(error.message).logs).toContain(`[mod-allowance] fail ${transfer.call_contract.entry_point}`);

  // expect unaltered balances
  const { result: r1 } = await tokenContract["balanceOf"]({
    owner: account1Sign.address
  });
  expect(r1).toStrictEqual({
    value: "100",
  });

  const { result: r2 } = await tokenContract["balanceOf"]({
    owner: account2Sign.address
  });
  expect(r2).toStrictEqual({
    value: "0",
  });
});


it("account1 tries a transfer with legit allowance", async () => {
  // prepare operation
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // allow operation
  const { operation: allow } = await modContract['allow']({
    user: account1Sign.address,
    operation: {
      contract_id: transfer.call_contract.contract_id,
      entry_point: transfer.call_contract.entry_point,
      args: transfer.call_contract.args
    }
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider,
  });

  await tx.pushOperation(allow);
  await tx.pushOperation(transfer);
  const receipt = await tx.send();
  await tx.wait();

  //console.log(receipt);
  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain('[mod-allowance] skip allow');
  expect(receipt.logs).toContain(`[mod-allowance] allowing ${transfer.call_contract.entry_point}`);
  expect(receipt.logs).toContain(`[account] selected scope contract_call`);

  // check balances
  const { result: r1 } = await tokenContract["balanceOf"]({
    owner: account1Sign.address
  });
  expect(r1).toStrictEqual({
    value: "99",
  });

  const { result: r2 } = await tokenContract["balanceOf"]({
    owner: account2Sign.address
  });
  expect(r2).toStrictEqual({
    value: "1",
  });
});

it("reinstall module in scope (entry_point=transfer)", async () => {
  // prepare operation to obtain a new entry_point scope
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // install module with the new scope
  const scope = await modSerializer.serialize({
    operation_type: 'contract_call',
    entry_point: transfer.call_contract.entry_point
  }, "scope");

  const { operation: install_module } = await account1Contract["install_module"]({
    module_type_id: 1,
    contract_id: modAllowance.address,
    scopes: [
      utils.encodeBase64url(scope)
    ]
  }, { onlyOperation: true });

  const { operation: allow_install_module } = await modContract['allow']({
    user: account1Sign.address,
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  const { operation: exec_install_module } = await account1Contract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider,
  });

  await tx.pushOperation(allow_install_module);
  await tx.pushOperation(exec_install_module);
  const receipt = await tx.send();
  await tx.wait();

  //console.log(receipt);

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain(`[account] selected scope contract_call`);
});


it("account1 re-tries a transfer with legit allowance", async () => {
  // prepare operation
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // allow operation
  const { operation: allow } = await modContract['allow']({
    user: account1Sign.address,
    operation: {
      contract_id: transfer.call_contract.contract_id,
      entry_point: transfer.call_contract.entry_point,
      args: transfer.call_contract.args
    }
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider,
  });

  await tx.pushOperation(allow);
  await tx.pushOperation(transfer);
  const receipt = await tx.send();
  await tx.wait();

  console.log(receipt);
  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain('[mod-allowance] skip allow');
  expect(receipt.logs).toContain(`[mod-allowance] allowing ${transfer.call_contract.entry_point}`);
  expect(receipt.logs).toContain(`[account] selected scope contract_call + ${transfer.call_contract.entry_point}`);

  // check balances
  const { result: r1 } = await tokenContract["balanceOf"]({
    owner: account1Sign.address
  });
  expect(r1).toStrictEqual({
    value: "98",
  });

  const { result: r2 } = await tokenContract["balanceOf"]({
    owner: account2Sign.address
  });
  expect(r2).toStrictEqual({
    value: "2",
  });
});

/*
it("operation skipped", async () => {
  // prepare operation
  const { operation: test } = await account1Contract['test']({}, { onlyOperation: true });

  // validate operation
  const { operation: validate } = await modContract['is_authorized']({
    call: {
      contract_id: test.call_contract.contract_id,
      entry_point: test.call_contract.entry_point,
      data: test.call_contract.args
    },
    type: 0
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider,
  });

  await tx.pushOperation(validate);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain(`[mod-allowance] fail ${test.call_contract.entry_point}`);
});
*/