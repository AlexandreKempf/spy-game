import { writable } from 'svelte/store';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

function set_store_for_user(store, payload) {
    let sender_store = payload.users[payload.username]
    store.update((receiver_store) => {
        return {
            ...receiver_store,
            users: { ...receiver_store.users, [payload.username]: sender_store },
            common: (sender_store.master || receiver_store.common == null) ? payload.common : receiver_store.common
        }
    })
};


export function multiplayerStore(room_name, username, content, sudo = false) {

    const channel = supabase.channel(room_name)

    let store = writable({ common: null, users: { [username]: content }, username: username });

    channel
        .on('broadcast', { event: 'store-update' }, ({ event, payload, type }) => { set_store_for_user(store, payload) })
        .subscribe()
        .track(null)


    async function set(new_value) {
        await channel.send({
            type: 'broadcast',
            event: 'store-update',
            payload: new_value
        })
        store.update((old_value) => new_value)
    }


    return {
        subscribe: store.subscribe,
        set: set,
    };
}
