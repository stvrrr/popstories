create or replace function public.capture_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_data jsonb := to_jsonb(new);
  v_action_type text;
  v_source_id uuid;
  v_actor_id uuid;
  v_recipient_id uuid;
  v_story_id uuid;
  v_detail text;
  v_occurred_at timestamptz;
begin
  v_source_id := nullif(v_row_data ->> 'id', '')::uuid;
  v_occurred_at := coalesce((v_row_data ->> 'created_at')::timestamptz, now());

  if tg_table_name = 'follows' then
    v_action_type := 'follow';
    v_actor_id := (v_row_data ->> 'follower_id')::uuid;
    v_recipient_id := (v_row_data ->> 'following_id')::uuid;
  else
    v_action_type := case tg_table_name
      when 'likes' then 'like'
      when 'favorites' then 'favorite'
      when 'story_comments' then 'comment'
    end;
    v_actor_id := (v_row_data ->> 'user_id')::uuid;
    v_story_id := (v_row_data ->> 'story_id')::uuid;
    v_detail := case when v_action_type = 'comment' then v_row_data ->> 'content' else null end;

    select s.author_id
    into v_recipient_id
    from public.stories as s
    where s.id = v_story_id;
  end if;

  if v_action_type is null or v_actor_id is null or v_recipient_id is null or v_actor_id = v_recipient_id then
    return new;
  end if;

  v_source_id := coalesce(
    v_source_id,
    md5(jsonb_build_array(v_action_type, v_actor_id, v_recipient_id, v_story_id, v_detail, v_occurred_at)::text)::uuid
  );

  insert into public.activity_events (
    event_type, source_id, actor_id, recipient_id, story_id, detail, created_at
  )
  values (
    v_action_type, v_source_id, v_actor_id, v_recipient_id, v_story_id, v_detail, v_occurred_at
  )
  on conflict (event_type, source_id) do nothing;

  return new;
end;
$$;
